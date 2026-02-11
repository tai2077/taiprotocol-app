import React, { useEffect, useRef, useState } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { api } from '../lib/api';
import { MARKETING_VAULT, SALE_CONTRACT } from '../lib/config';
import { buildJsonPayload, buildSaleV2ClaimPayload } from '../lib/tx';
import { useToast } from '../components/ToastProvider';
import { AppLocale, formatTai, toTaiNumber } from '../lib/format';
import { pollUntil } from '../lib/txConfirm';
import { getTonProofPayload, serializeTonProofHeader, setupTonProofConnectRequest } from '../lib/tonProof';

interface RewardsProps {
  walletAddress: string | null;
  locale: AppLocale;
}

const Rewards: React.FC<RewardsProps> = ({ walletAddress, locale }) => {
  const isZh = locale === 'zh';
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const { notify } = useToast();
  const [claimable, setClaimable] = useState<Awaited<ReturnType<typeof api.getClaimable>> | null>(null);
  const [portfolio, setPortfolio] = useState<Awaited<ReturnType<typeof api.getPortfolio>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [viewMode, setViewMode] = useState<'claimable' | 'locked'>('claimable');
  const notifyRef = useRef(notify);
  const isZhRef = useRef(isZh);

  useEffect(() => {
    notifyRef.current = notify;
    isZhRef.current = isZh;
  }, [notify, isZh]);

  useEffect(() => {
    if (!walletAddress) {
      setClaimable(null);
      setPortfolio(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.allSettled([api.getClaimable(walletAddress), api.getPortfolio(walletAddress)])
      .then(([claimableRes, portfolioRes]) => {
        if (cancelled) return;
        if (claimableRes.status === 'fulfilled') {
          setClaimable(claimableRes.value);
        } else {
          setClaimable(null);
          notifyRef.current(isZhRef.current ? '奖励数据读取失败' : 'Failed to load reward data', 'error');
        }

        if (portfolioRes.status === 'fulfilled') {
          setPortfolio(portfolioRes.value);
        } else {
          setPortfolio(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  const pendingTai = toTaiNumber(claimable?.pendingTotalTai || portfolio?.totalPending || 0);
  const unlockedTai = toTaiNumber(claimable?.unlockedTai || 0);
  const lockedTai = toTaiNumber(claimable?.lockedTai || 0);
  const finalRatio = claimable?.ratios?.finalRatioBp || 0;
  const taskSaveRatio = claimable?.ratios?.taskSaveRatioBp || 0;
  const unlockProgress = pendingTai > 0 ? Math.min(100, Math.round((unlockedTai / Math.max(pendingTai, 1)) * 100)) : 0;
  const canClaimNow = claimable?.source === 'sale-v2' ? unlockedTai > 0 : pendingTai > 0;
  const canClaimAction = viewMode === 'claimable' && canClaimNow;

  const reconnectForTonProof = async () => {
    setupTonProofConnectRequest(tonConnectUI);
    if (wallet) {
      await tonConnectUI.disconnect();
    }
    await tonConnectUI.openModal();
  };

  const getTonProofHeader = (): string | null => {
    if (!walletAddress) return null;
    const proofPayload = getTonProofPayload(wallet, walletAddress);
    if (!proofPayload) return null;
    return serializeTonProofHeader(proofPayload);
  };

  const humanizeClaimError = (msg: string): string => {
    const code = msg.toUpperCase();
    if (code.includes('TON_PROOF_REQUIRED') || code.includes('TON_PROOF_INVALID') || code.includes('TON_PROOF_EXPIRED')) {
      return isZh ? 'TON Proof 已过期，请重新连接钱包后再领取。' : 'Ton Proof expired. Reconnect wallet and try again.';
    }
    if (code.includes('NO_UNLOCKED_REWARDS')) {
      return isZh ? '当前暂无可解锁奖励，请先完成任务/存款路径、邀请或等待时间窗。' : 'No unlocked rewards yet. Complete missions/save path, invites, or wait for time window.';
    }
    if (code.includes('RATE_LIMITED')) {
      return isZh ? '操作过于频繁，请稍后重试。' : 'Too many requests. Please try again later.';
    }
    if (code.includes('SIGNER_NOT_CONFIGURED')) {
      return isZh ? '签名服务未配置，请联系管理员。' : 'Signer is not configured on backend.';
    }
    if (code.includes('INVALID_CLAIM_SIGNATURE')) {
      return isZh ? '领取签名缺失，请稍后重试。' : 'Claim signature is missing. Please retry later.';
    }
    return msg || (isZh ? '领取失败，请重试' : 'Claim failed, please retry');
  };

  const refreshData = async () => {
    if (!walletAddress) return;
    const [nextClaimable, nextPortfolio] = await Promise.allSettled([
      api.getClaimable(walletAddress),
      api.getPortfolio(walletAddress),
    ]);
    if (nextClaimable.status === 'fulfilled') setClaimable(nextClaimable.value);
    if (nextPortfolio.status === 'fulfilled') setPortfolio(nextPortfolio.value);
  };

  const claimAll = async () => {
    if (viewMode === 'locked') {
      notify(
        isZh
          ? '当前是锁定奖励视图，切换到“可领取”后再发起领取。'
          : 'You are viewing locked rewards. Switch to Claimable to proceed.',
        'info'
      );
      return;
    }
    if (!walletAddress) return tonConnectUI.openModal();
    if (!canClaimNow) {
      notify(isZh ? '暂无可领取奖励' : 'No claimable rewards yet', 'info');
      return;
    }

    const pendingBefore = pendingTai;
    try {
      setClaiming(true);

      if (claimable?.source === 'sale-v2') {
        const tonProofHeader = getTonProofHeader();
        if (!tonProofHeader) {
          notify(
            isZh
              ? '领取 Sale V2 奖励前需要 TON Proof 授权，请重新连接钱包。'
              : 'Sale V2 claim requires Ton Proof. Please reconnect wallet.',
            'info'
          );
          await reconnectForTonProof();
          return;
        }

        const signed = await api.claimSaleV2TaskReward({ walletAddress }, tonProofHeader);
        const payload = buildSaleV2ClaimPayload({
          amount: signed.amount,
          nonce: signed.nonce,
          deadline: signed.deadline,
          signature: signed.signature,
        });

        await tonConnectUI.sendTransaction({
          validUntil: Math.floor(Date.now() / 1000) + 600,
          messages: [{ address: SALE_CONTRACT, amount: '120000000', payload }],
        });
      } else {
        const data = await api.claimMarketing({ wallet_address: walletAddress });
        if (!data?.data?.amount || !data?.data?.nonce || !data?.data?.signature) {
          throw new Error('INVALID_CLAIM_SIGNATURE');
        }
        const payload = buildJsonPayload({ amount: data.data.amount, nonce: data.data.nonce, signature: data.data.signature });
        await tonConnectUI.sendTransaction({
          validUntil: Math.floor(Date.now() / 1000) + 600,
          messages: [{ address: MARKETING_VAULT, amount: '60000000', payload }],
        });
      }

      const confirmed = await pollUntil(
        async () => {
          const next = await api.getClaimable(walletAddress);
          setClaimable(next);
          return next;
        },
        (next) => toTaiNumber(next.pendingTotalTai || 0) < pendingBefore,
        { timeoutMs: 90_000, intervalMs: 3_000 }
      );

      if (confirmed && toTaiNumber(confirmed.pendingTotalTai || 0) < pendingBefore) {
        notify(isZh ? '奖励已链上确认并领取' : 'Rewards confirmed and claimed on-chain', 'success');
      } else {
        notify(isZh ? '交易已提交，等待链上确认' : 'Transaction submitted, waiting for on-chain confirmation', 'info');
      }
      await refreshData();
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      notify(humanizeClaimError(msg), 'error');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="page-view">
      <div className="neo-card-dark p-6 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-12 -right-14 h-44 w-44 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative z-10">
          <p className="section-kicker text-accent">{isZh ? '奖励中心' : 'Reward Center'}</p>
          <p className="text-3xl font-black">{loading ? '...' : formatTai(pendingTai, locale)}</p>
          <p className="text-xs font-bold text-white/70 mt-1">{isZh ? '链下记录 / 链上领取（用户自费 Gas）' : 'Recorded off-chain / claimed on-chain (user pays gas)'}</p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/10 brutal-border-thin font-black">
              {claimable?.source === 'sale-v2' ? (isZh ? '来源：Sale V2' : 'Source: Sale V2') : (isZh ? '来源：Marketing Vault' : 'Source: Marketing Vault')}
            </span>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-primary text-bg-dark brutal-border-thin font-black">
              {isZh ? '可领取比例' : 'Claim Ratio'} {Math.floor(finalRatio / 100)}%
            </span>
          </div>
        </div>
      </div>

      <div className="neo-card p-1.5 flex">
        <button
          type="button"
          aria-pressed={viewMode === 'claimable'}
          className={`flex-1 py-2.5 rounded-xl text-[11px] font-black transition ${
            viewMode === 'claimable' ? 'bg-bg-dark text-white' : 'text-black/60'
          }`}
          onClick={() => setViewMode('claimable')}
        >
          {isZh ? '可领取' : 'Claimable'}
        </button>
        <button
          type="button"
          aria-pressed={viewMode === 'locked'}
          className={`flex-1 py-2.5 rounded-xl text-[11px] font-black transition ${
            viewMode === 'locked' ? 'bg-bg-dark text-white' : 'text-black/60'
          }`}
          onClick={() => setViewMode('locked')}
        >
          {isZh ? '锁定中' : 'Locked'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="neo-card p-4">
          <p className="section-kicker">{isZh ? '待领取总额' : 'Total Pending'}</p>
          <p className="text-lg font-black">{loading ? '...' : formatTai(pendingTai, locale)}</p>
        </div>
        <div className="neo-card p-4">
          <p className="section-kicker">{viewMode === 'locked' ? (isZh ? '锁定奖励' : 'Locked Rewards') : (isZh ? '当前可领' : 'Unlock Now')}</p>
          <p className="text-lg font-black">{loading ? '...' : formatTai(viewMode === 'locked' ? lockedTai : (unlockedTai || pendingTai), locale)}</p>
        </div>
      </div>

      <div className="neo-card p-4">
        <div className="flex items-center justify-between text-xs font-black">
          <p>{isZh ? '奖励解锁进度' : 'Unlock Progress'}</p>
          <p>{loading ? '...' : `${unlockProgress}%`}</p>
        </div>
        <div className="mt-2 h-3 bg-black/10 brutal-border-thin rounded-full overflow-hidden p-[1px]">
          <div className="h-full rounded-full bg-gradient-to-r from-accent to-primary transition-all duration-500" style={{ width: `${unlockProgress}%` }} />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs font-black">
          <p>{isZh ? '未解锁奖励' : 'Locked Rewards'}</p>
          <p>{loading ? '...' : formatTai(lockedTai, locale)}</p>
        </div>
        <div className="flex items-center justify-between text-xs font-black mt-2">
          <p>{isZh ? '邀请达成数' : 'Invite Count'}</p>
          <p>{claimable?.inviteCount ?? 0}</p>
        </div>
        <div className="flex items-center justify-between text-xs font-black mt-2">
          <p>{isZh ? '任务解锁进度' : 'Mission Unlock'}</p>
          <p>{Math.floor(taskSaveRatio / 100)}%</p>
        </div>
        <div className="flex items-center justify-between text-xs font-black mt-2">
          <p>{isZh ? '当前总解锁比例' : 'Final Unlock Ratio'}</p>
          <p>{Math.floor(finalRatio / 100)}%</p>
        </div>
        <p className="text-[10px] font-bold text-black/60 mt-3">
          {isZh
            ? '不邀请用户也可通过任务和存款路径提高解锁比例，最终可达 100%。'
            : 'Users can still unlock up to 100% via mission + save path without invites.'}
        </p>
      </div>

      <div className="neo-card-dark p-4">
        <p className="section-kicker text-accent">{isZh ? '本次领取说明' : 'Claim Notes'}</p>
        <div className="mt-2 space-y-1 text-[11px] font-bold text-white/75">
          <p>{isZh ? '1) 后端签名后发起链上领取交易' : '1) Backend signs, then on-chain claim is sent'}</p>
          <p>{isZh ? '2) 你钱包支付链上 Gas' : '2) Wallet pays on-chain gas fee'}</p>
          <p>{isZh ? '3) 交易确认后待领取余额减少' : '3) Pending balance decreases after confirmation'}</p>
        </div>
      </div>

      <button
        onClick={claimAll}
        disabled={claiming || !canClaimAction}
        className="w-full tai-btn tai-btn-primary pulse-border disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {claiming
          ? (isZh ? '提交中...' : 'Submitting...')
          : viewMode === 'locked'
            ? (isZh ? '锁定奖励暂不可领取' : 'Locked rewards not claimable')
            : isZh
              ? '一次性领取（链上）'
              : 'One-Click Claim (On-chain)'}
      </button>
    </div>
  );
};

export default Rewards;
