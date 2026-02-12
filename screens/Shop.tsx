import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { api } from '../lib/api';
import { SALE_CONTRACT } from '../lib/config';
import { buildTextPayload } from '../lib/tx';
import { useToast } from '../components/ToastProvider';
import { AppLocale, formatPoints } from '../lib/format';
import { safeGetStorage, safeSetStorage } from '../lib/storage';
import { pollUntil } from '../lib/txConfirm';
import { getTonProofPayload, serializeTonProofHeader, setupTonProofConnectRequest } from '../lib/tonProof';

type Tier = 1 | 2 | 3;
type TierKey = 'tier1' | 'tier2' | 'tier3';
type IngestionStep = 'idle' | 'binding' | 'sending_tx' | 'reconciling' | 'indexing' | 'completed' | 'error';

interface SalePackage {
  tier: Tier;
  name: string;
  enName: string;
  ton: string;
  tonNano: string;
  basePoints: number;
  taskPoints: number;
  totalPoints: number;
  maxPurchases: number;
  op: string;
  desc: string;
  enDesc: string;
  tag?: string;
  enTag?: string;
  highlight?: boolean;
}

const PACKAGES: SalePackage[] = [
  {
    tier: 1,
    name: '轻量包',
    enName: 'Starter',
    ton: '9.99',
    tonNano: '9990000000',
    basePoints: 60_000,
    taskPoints: 120_000,
    totalPoints: 180_000,
    maxPurchases: 3,
    op: 'buy_tier1',
    desc: '轻量入门，先创建第一个目标',
    enDesc: 'Starter package for first target.',
    tag: '新手推荐',
    enTag: 'Recommended',
  },
  {
    tier: 2,
    name: '加速包',
    enName: 'Booster',
    ton: '99.99',
    tonNano: '99990000000',
    basePoints: 600_000,
    taskPoints: 1_200_000,
    totalPoints: 1_800_000,
    maxPurchases: 2,
    op: 'buy_tier2',
    desc: '快速补存，缩短达标时间',
    enDesc: 'Speed up deposits and progress.',
    tag: '最受欢迎',
    enTag: 'Most Popular',
    highlight: true,
  },
  {
    tier: 3,
    name: '冲榜包',
    enName: 'Rank Rush',
    ton: '999.99',
    tonNano: '999990000000',
    basePoints: 6_000_000,
    taskPoints: 12_000_000,
    totalPoints: 18_000_000,
    maxPurchases: 1,
    op: 'buy_tier3',
    desc: '冲刺榜单与裂变任务进度',
    enDesc: 'High-tier package for ranking growth.',
    tag: '限购 1 次',
    enTag: 'Limited 1x',
  },
];

interface ShopProps {
  walletAddress: string | null;
  locale: AppLocale;
}

const Shop: React.FC<ShopProps> = ({ walletAddress, locale }) => {
  const isZh = locale === 'zh';
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const { notify } = useToast();
  const [searchParams] = useSearchParams();
  const [selected, setSelected] = useState(0);
  const [buying, setBuying] = useState(false);
  const [txStep, setTxStep] = useState<'idle' | 'sending' | 'submitted' | 'confirming' | 'confirmed'>('idle');
  const [ingestionStep, setIngestionStep] = useState<IngestionStep>('idle');
  const [ingestionNote, setIngestionNote] = useState('');
  const [recent, setRecent] = useState<Awaited<ReturnType<typeof api.getRecentPurchases>>>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [purchaseCounts, setPurchaseCounts] = useState<Record<TierKey, number>>({
    tier1: 0,
    tier2: 0,
    tier3: 0,
  });
  const [countsLoading, setCountsLoading] = useState(false);

  useEffect(() => {
    setLoadingRecent(true);
    api
      .getRecentPurchases()
      .then((d) => setRecent(d || []))
      .catch(() => {
        setRecent([]);
      })
      .finally(() => setLoadingRecent(false));
  }, []);

  useEffect(() => {
    const paramRef = searchParams.get('ref');
    const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
    const tgRef = startParam ? (startParam.toLowerCase().startsWith('ref_') ? startParam.slice(4) : startParam) : null;

    const rawRef = (paramRef || tgRef || '').trim();
    const normalizedRef = rawRef.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase();

    if (normalizedRef) {
      setInviteCode(normalizedRef);
      safeSetStorage('tai_ref', normalizedRef);
      return;
    }
    const cached = safeGetStorage('tai_ref');
    if (cached) setInviteCode(cached);
  }, [searchParams]);

  const pkg = useMemo(() => PACKAGES[selected], [selected]);
  const shortAddress = walletAddress ? walletAddress.toLowerCase() : '';
  const txProgress = txStep === 'idle' ? 0 : txStep === 'sending' ? 25 : txStep === 'submitted' ? 50 : txStep === 'confirming' ? 75 : 100;
  const txSteps = isZh ? ['发送', '提交', '确认', '完成'] : ['Send', 'Submit', 'Confirm', 'Done'];
  const ingestionProgress =
    ingestionStep === 'idle'
      ? 0
      : ingestionStep === 'binding'
        ? 15
        : ingestionStep === 'sending_tx'
          ? 40
          : ingestionStep === 'reconciling'
            ? 65
            : ingestionStep === 'indexing'
              ? 85
              : 100;
  const ingestionLabel =
    ingestionStep === 'binding'
      ? (isZh ? '绑定邀请码' : 'Binding Invite')
      : ingestionStep === 'sending_tx'
        ? (isZh ? '交易发送中' : 'Sending Tx')
        : ingestionStep === 'reconciling'
          ? (isZh ? '后端入账同步' : 'Reconciling')
          : ingestionStep === 'indexing'
            ? (isZh ? '链上索引确认' : 'Indexing Chain')
            : ingestionStep === 'completed'
              ? (isZh ? '入账完成' : 'Ingestion Completed')
              : ingestionStep === 'error'
                ? (isZh ? '入账异常' : 'Ingestion Error')
                : '';

  useEffect(() => {
    if (!walletAddress) {
      setPurchaseCounts({ tier1: 0, tier2: 0, tier3: 0 });
      return;
    }
    setCountsLoading(true);
    api
      .getPurchaseCounts(walletAddress)
      .then((res) => {
        setPurchaseCounts({
          tier1: Number(res?.counts?.tier1 || 0),
          tier2: Number(res?.counts?.tier2 || 0),
          tier3: Number(res?.counts?.tier3 || 0),
        });
      })
      .catch(() => {
        setPurchaseCounts({ tier1: 0, tier2: 0, tier3: 0 });
      })
      .finally(() => setCountsLoading(false));
  }, [walletAddress]);

  const getRemaining = (tier: Tier): number => {
    const item = PACKAGES.find((p) => p.tier === tier);
    if (!item) return 0;
    const key = `tier${tier}` as TierKey;
    const used = Number(purchaseCounts[key] || 0);
    return Math.max(0, item.maxPurchases - used);
  };

  const humanizeError = (msg: string): string => {
    const lower = msg.toLowerCase();
    if (lower.includes('insufficient') || lower.includes('balance')) return isZh ? '余额不足，请先补充 TON。' : 'Insufficient balance. Please top up TON.';
    if (lower.includes('reject') || lower.includes('cancel')) return isZh ? '你已取消本次交易。' : 'Transaction cancelled.';
    if (lower.includes('expired')) return isZh ? '报价已过期，请重试。' : 'Quote expired. Please retry.';
    if (lower.includes('network') || lower.includes('timeout')) return isZh ? '网络异常，请稍后重试。' : 'Network error. Please retry.';
    return isZh ? '交易失败，请稍后再试。' : 'Transaction failed. Please retry.';
  };

  const humanizeBindError = (msg: string): string => {
    const code = msg.toUpperCase();
    if (code.includes('TON_PROOF_REQUIRED') || code.includes('TON_PROOF_INVALID') || code.includes('TON_PROOF_EXPIRED')) {
      return isZh ? '绑定邀请前需要 TON Proof 授权，请重新连接钱包。' : 'Invite binding requires Ton Proof. Please reconnect wallet.';
    }
    if (code.includes('INVALID_INVITE_CODE')) return isZh ? '邀请码无效，请确认后重试。' : 'Invalid invite code. Please verify and retry.';
    if (code.includes('BIND_BEFORE_PURCHASE_REQUIRED')) return isZh ? '该钱包已有购买记录，无法再绑定邀请码。' : 'This wallet already has purchases and can no longer bind an invite code.';
    if (code.includes('CANNOT_INVITE_YOURSELF')) return isZh ? '不能绑定自己的邀请码。' : 'You cannot bind your own invite code.';
    if (code.includes('RATE_LIMITED')) return isZh ? '操作频繁，请稍后再试。' : 'Too many requests. Please try again later.';
    return isZh ? '邀请码绑定失败，请稍后重试。' : 'Invite binding failed. Please retry.';
  };

  const reconnectForTonProof = async () => {
    setupTonProofConnectRequest(tonConnectUI);
    if (wallet) {
      await tonConnectUI.disconnect();
    }
    await tonConnectUI.openModal();
  };

  const getTonProofHeader = (): string | null => {
    if (!walletAddress) return null;
    const payload = getTonProofPayload(wallet, walletAddress);
    if (!payload) return null;
    return serializeTonProofHeader(payload);
  };

  const handleBuy = async () => {
    if (!walletAddress) return tonConnectUI.openModal();
    const remaining = getRemaining(pkg.tier);
    if (remaining <= 0) {
      notify(isZh ? '当前档位已达到限购上限' : 'Purchase limit reached for this tier', 'info');
      return;
    }

    const tonProofHeader = getTonProofHeader();
    if (inviteCode) {
      setIngestionStep('binding');
      setIngestionNote(isZh ? '正在绑定邀请码...' : 'Binding invite code...');
      if (!tonProofHeader) {
        const msg =
          isZh
            ? '购买前需先完成 TON Proof 授权，以绑定邀请码。请重新连接钱包。'
            : 'Ton Proof is required before purchase to bind invite code. Please reconnect wallet.';
        notify(
          msg,
          'info'
        );
        setIngestionStep('error');
        setIngestionNote(msg);
        await reconnectForTonProof();
        window.setTimeout(() => {
          setIngestionStep('idle');
          setIngestionNote('');
        }, 2500);
        return;
      }

      try {
        await api.bindInvite({ walletAddress, inviteCode }, tonProofHeader);
        setIngestionStep('sending_tx');
        setIngestionNote(isZh ? '邀请码绑定成功，准备发送交易。' : 'Invite bound. Preparing transaction.');
      } catch (error) {
        const msg = error instanceof Error ? error.message : '';
        const friendly = humanizeBindError(msg);
        notify(friendly, 'error');
        setIngestionStep('error');
        setIngestionNote(friendly);
        window.setTimeout(() => {
          setIngestionStep('idle');
          setIngestionNote('');
        }, 3000);
        return;
      }
    } else {
      setIngestionStep('sending_tx');
      setIngestionNote(isZh ? '正在准备链上交易...' : 'Preparing on-chain transaction...');
    }

    const submittedAt = Date.now();
    const previousHits = recent.filter((r) => (r.address || '').toLowerCase().includes(shortAddress.slice(0, 8)) && r.tier === pkg.tier).length;
    try {
      setBuying(true);
      setTxStep('sending');
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{ address: SALE_CONTRACT, amount: pkg.tonNano, payload: buildTextPayload(pkg.op) }],
      });
      setTxStep('submitted');
      setIngestionStep('reconciling');
      setIngestionNote(isZh ? '交易已发送，正在同步后端入账记录...' : 'Transaction sent. Reconciling backend ingestion...');
      if (tonProofHeader) {
        const reconcileResult = await api.reconcilePurchases({ walletAddress }, tonProofHeader).catch(() => null);
        if (reconcileResult?.counts) {
          setPurchaseCounts({
            tier1: Number(reconcileResult.counts.tier1 || 0),
            tier2: Number(reconcileResult.counts.tier2 || 0),
            tier3: Number(reconcileResult.counts.tier3 || 0),
          });
        }
        if (reconcileResult) {
          const synced = Number(reconcileResult.sync?.synced || 0);
          const syncErrors = Array.isArray(reconcileResult.sync?.errors) ? reconcileResult.sync.errors.length : 0;
          setIngestionNote(
            isZh
              ? `后端同步完成：新增 ${synced} 笔，异常 ${syncErrors} 笔。`
              : `Reconcile complete: ${synced} new, ${syncErrors} errors.`
          );
        } else {
          setIngestionNote(isZh ? '后端同步暂时不可用，继续等待链上确认。' : 'Reconcile temporarily unavailable. Waiting for chain confirmation.');
        }
      } else {
        setIngestionNote(isZh ? '未获取到 TON Proof，跳过后端同步，继续等待链上确认。' : 'Ton Proof missing, skipped reconcile. Waiting for chain confirmation.');
      }
      setTxStep('confirming');
      setIngestionStep('indexing');
      setIngestionNote(isZh ? '正在等待链上索引确认...' : 'Waiting for on-chain indexing...');

      const confirmedRecent = await pollUntil(
        () => api.getRecentPurchases(),
        (items) => {
          const matches = items.filter((r) => (r.address || '').toLowerCase().includes(shortAddress.slice(0, 8)) && r.tier === pkg.tier);
          const hasFresh = matches.some((m) => (m.timestamp ? new Date(m.timestamp).getTime() >= submittedAt - 60_000 : false));
          return matches.length > previousHits || hasFresh;
        },
        { timeoutMs: 90_000, intervalMs: 3_000 }
      );

      if (confirmedRecent) {
        setRecent(confirmedRecent);
        setTxStep('confirmed');
        setIngestionStep('completed');
        setIngestionNote(isZh ? '购买已入账，链上确认完成。' : 'Purchase ingestion completed on chain.');
        await api
          .getPurchaseCounts(walletAddress)
          .then((res) => {
            setPurchaseCounts({
              tier1: Number(res?.counts?.tier1 || 0),
              tier2: Number(res?.counts?.tier2 || 0),
              tier3: Number(res?.counts?.tier3 || 0),
            });
          })
          .catch(() => {
            setPurchaseCounts((prev) => {
              const key = `tier${pkg.tier}` as TierKey;
              return { ...prev, [key]: Math.min(PACKAGES.find((p) => p.tier === pkg.tier)?.maxPurchases || prev[key] + 1, prev[key] + 1) };
            });
          });
        notify(
          isZh ? `购买已链上确认，积分 +${formatPoints(pkg.totalPoints, locale)}` : `Purchase confirmed, points +${formatPoints(pkg.totalPoints, locale)}`,
          'success'
        );
        window.setTimeout(() => {
          setTxStep('idle');
          setIngestionStep('idle');
          setIngestionNote('');
        }, 2500);
        return;
      }
      notify(isZh ? '交易已提交，链上确认中' : 'Transaction submitted, waiting for on-chain confirmation', 'info');
      setIngestionStep('indexing');
      setIngestionNote(isZh ? '交易已提交，网络繁忙时可能需要更长时间索引。' : 'Transaction submitted. Indexing may take longer during network congestion.');
      window.setTimeout(() => {
        setIngestionStep('idle');
        setIngestionNote('');
      }, 4000);
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      const friendly = msg ? humanizeError(msg) : humanizeError('');
      notify(friendly, 'error');
      setTxStep('idle');
      setIngestionStep('error');
      setIngestionNote(friendly);
      window.setTimeout(() => {
        setIngestionStep('idle');
        setIngestionNote('');
      }, 3500);
    } finally {
      setBuying(false);
      window.setTimeout(() => setTxStep((step) => (step === 'confirmed' ? step : 'idle')), 1500);
    }
  };

  const selectedRemaining = getRemaining(pkg.tier);
  const canBuy = !buying && (!walletAddress || selectedRemaining > 0);

  return (
    <div className="page-view">
      <div className="hero-card p-6">

        <div>
          <p className="section-kicker">{isZh ? '销售补给矩阵' : 'Supply Matrix'}</p>
          <p className="text-3xl font-black tracking-tight mt-1">
            {isZh ? '当前补给：' : 'Selected: '}
            <span>{isZh ? pkg.name : pkg.enName}</span>
          </p>
          <p className="text-xs font-bold text-white/60 mt-1">{isZh ? pkg.desc : pkg.enDesc}</p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="imperial-data rounded-xl px-2.5 py-2">
              <p className="text-[9px] font-bold text-white/60">TON</p>
              <p className="text-sm font-black">{pkg.ton}</p>
            </div>
            <div className="imperial-data rounded-xl px-2.5 py-2">
              <p className="text-[9px] font-bold text-white/60">{isZh ? '总积分' : 'Total Points'}</p>
              <p className="text-sm font-black">{formatPoints(pkg.totalPoints, locale)}</p>
            </div>
            <div className="imperial-deep rounded-xl px-2.5 py-2">
              <p className="text-[9px] font-bold">{isZh ? '剩余可购' : 'Remaining'}</p>
              <p className="text-sm font-black">{selectedRemaining}</p>
            </div>
          </div>
          <p className="text-[10px] font-bold text-white/60 mt-2">
            {isZh ? '购买获得积分，积分用于下一轮代币解锁优先购买额度。' : 'Purchases grant points used for next-round unlock priority quota.'}
          </p>
        </div>
      </div>

      {inviteCode && (
        <div className="neo-card p-3.5">
          <p className="text-[10px] font-black uppercase tracking-wider text-white/55">{isZh ? '邀请码已绑定' : 'Invite Code Bound'}</p>
          <p className="text-sm font-black mt-1">{inviteCode}</p>
        </div>
      )}

      {txStep !== 'idle' && (
        <div className="neo-card p-4">
          <div className="flex items-center justify-between text-xs font-black">
            <span>{isZh ? '交易进度' : 'Transaction Progress'}</span>
            <span>
              {txStep === 'sending' && (isZh ? '发送中' : 'Sending')}
              {txStep === 'submitted' && (isZh ? '已发送' : 'Submitted')}
              {txStep === 'confirming' && (isZh ? '确认中' : 'Confirming')}
              {txStep === 'confirmed' && (isZh ? '已完成' : 'Completed')}
            </span>
          </div>
          <div className="mt-2 imperial-progress-track">
            <div className="imperial-progress-fill" style={{ width: `${txProgress}%` }} />
          </div>
          <div className="mt-3 flex items-center justify-between px-1">
            {txSteps.map((step, idx) => {
              const done = txProgress >= (idx + 1) * 25;
              return (
                <div key={step} className="flex flex-col items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={
                      done
                        ? {
                          background:
                            'linear-gradient(180deg, #f6df9a 0%, #cfac56 100%)',
                          boxShadow: '0 0 8px rgba(207,172,86,0.35)',
                        }
                        : {
                          background: '#131313',
                          border: '1px solid rgba(207,172,86,0.24)',
                        }
                    }
                  />
                  <span className="text-[8px] font-black text-white/55">{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {ingestionStep !== 'idle' && (
        <div className={`neo-card p-4 ${ingestionStep === 'error' ? 'bg-[#2A0A10] border border-primary/45' : ''}`}>
          <div className="flex items-center justify-between text-xs font-black">
            <span>{isZh ? '入账状态' : 'Ingestion Status'}</span>
            <span>{ingestionLabel}</span>
          </div>
          <p className="mt-1 text-[11px] font-bold text-white/65">{ingestionNote}</p>
          <div className="mt-2 imperial-progress-track-sm">
            <div
              className={`h-full rounded-full transition-all duration-300 ${ingestionStep === 'error' ? 'bg-red-400' : 'imperial-progress-fill'}`}
              style={{ width: `${ingestionProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {PACKAGES.map((p, idx) => {
          const remaining = getRemaining(p.tier);
          const soldOut = remaining <= 0;
          const key = `tier${p.tier}` as TierKey;
          const used = purchaseCounts[key] || 0;
          const usagePct = Math.round((used / p.maxPurchases) * 100);
          const selectedStyle: React.CSSProperties | undefined =
            idx === selected
              ? {
                background:
                  'radial-gradient(120% 100% at 50% -20%, rgba(200, 16, 46, 0.15), transparent 60%), linear-gradient(180deg, rgba(20, 9, 11, 0.96), rgba(10, 10, 10, 0.98))',
                borderColor: 'rgba(207, 172, 86, 0.45)',
                boxShadow:
                  '0 0 0 1px rgba(207, 172, 86, 0.12) inset, 0 16px 32px -8px rgba(0, 0, 0, 0.5), 0 0 20px rgba(207, 172, 86, 0.08)',
              }
              : undefined;
          const badgeStyle: React.CSSProperties = p.highlight
            ? {
              background: 'linear-gradient(180deg, #ff4d6a 0%, #c8102e 100%)',
              color: '#fff',
              border: '1px solid rgba(255, 200, 200, 0.3)',
              boxShadow: '0 4px 12px rgba(200, 16, 46, 0.4)',
            }
            : {
              background: 'linear-gradient(180deg, #ffe4a0 0%, #cfac56 100%)',
              color: '#2a1700',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 4px 12px rgba(139, 104, 38, 0.35)',
            };

          return (
            <button
              key={p.tier}
              disabled={soldOut}
              className={`relative text-left p-4 rounded-2xl transition-all ${
                soldOut ? 'opacity-55 cursor-not-allowed imperial-data text-white' : 'hover-lift'
              } ${
                idx === selected
                  ? 'imperial-deep text-white ring-1 ring-accent/45 shadow-[0_14px_28px_rgba(207,172,86,0.18)]'
                  : 'neo-card text-white'
              }`}
              style={selectedStyle}
              onClick={() => !soldOut && setSelected(idx)}
            >
              {p.tag && (
                <span
                  className="absolute -top-2 -right-1 text-[10px] font-black px-2.5 py-1 rounded-full leading-none"
                  style={badgeStyle}
                >
                  {isZh ? p.tag : p.enTag}
                </span>
              )}

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black uppercase text-lg tracking-tight">{locale === 'zh' ? p.name : p.enName}</p>
                  <p className={`text-[11px] font-bold ${idx === selected ? 'text-white/70' : 'text-white/60'}`}>{locale === 'zh' ? p.desc : p.enDesc}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-2xl leading-none number-display">{p.ton}</p>
                  <p className={`text-[10px] font-black ${idx === selected ? 'text-white/65' : 'text-white/55'}`}>TON</p>
                </div>
              </div>

                <div className={`mt-3 space-y-1.5 text-xs font-bold ${idx === selected ? 'text-white/80' : 'text-white/75'}`}>
                  <div className="flex justify-between">
                  <span>{isZh ? '基础积分' : 'Base Points'}</span>
                  <span>{formatPoints(p.basePoints, locale)}</span>
                  </div>
                  <div className="flex justify-between">
                  <span>{isZh ? '任务积分' : 'Task Points'}</span>
                  <span>{formatPoints(p.taskPoints, locale)}</span>
                  </div>
                  <div className="flex justify-between pt-1 font-black opacity-90">
                  <span>{isZh ? '总计' : 'Total'}</span>
                  <span>{formatPoints(p.totalPoints, locale)}</span>
                  </div>
                </div>

              <div className="mt-2.5">
                <div className={`h-2 rounded-full overflow-hidden ${idx === selected ? 'bg-black/25' : 'bg-black/10'}`}>
                  <div className={`h-full ${idx === selected ? 'bg-primary' : 'bg-accent/55'}`} style={{ width: `${Math.min(100, usagePct)}%` }} />
                </div>
                <div className={`mt-1 flex items-center justify-between text-[10px] font-black ${idx === selected ? 'text-white/65' : 'text-white/55'}`}>
                  <span>{isZh ? `已购 ${used}/${p.maxPurchases}` : `${used}/${p.maxPurchases} used`}</span>
                  <span>{soldOut ? (isZh ? '已达上限' : 'Limit reached') : (isZh ? `剩余 ${remaining}` : `${remaining} left`)}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        className={`w-full tai-btn text-sm ${
          canBuy ? 'tai-btn-primary' : 'tai-btn-soft opacity-55 cursor-not-allowed'
        }`}
        disabled={!canBuy}
        title={!canBuy ? (isZh ? '该档位已达到限购上限' : 'This tier has reached the purchase limit') : undefined}
        onClick={handleBuy}
      >
        {buying
          ? (isZh ? '处理中...' : 'Processing...')
          : !walletAddress
            ? (isZh ? '连接钱包' : 'Connect Wallet')
            : selectedRemaining <= 0
              ? (isZh ? '已达限购上限' : 'Purchase Limit Reached')
              : (isZh ? `购买 ${pkg.name}` : `Buy ${pkg.enName}`)}
      </button>

      <div className="neo-card p-3.5 text-xs font-black">
        {countsLoading
          ? (isZh ? '正在读取链上购买次数...' : 'Loading on-chain purchase counts...')
          : (isZh ? `链上购买次数：T1 ${purchaseCounts.tier1} / T2 ${purchaseCounts.tier2} / T3 ${purchaseCounts.tier3}` : `On-chain counts: T1 ${purchaseCounts.tier1} / T2 ${purchaseCounts.tier2} / T3 ${purchaseCounts.tier3}`)}
      </div>

      <div className="neo-card p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="section-kicker">{isZh ? '最近购买' : 'Recent Purchases'}</p>
          <p className="text-[10px] font-black text-white/55">{loadingRecent ? '...' : recent.length}</p>
        </div>
        <div className="mt-2 space-y-2">
          {loadingRecent && <p className="text-xs font-bold text-white/60">{isZh ? '加载中...' : 'Loading...'}</p>}
          {!loadingRecent && recent.length === 0 && <p className="text-xs font-bold text-white/60">{isZh ? '暂无购买记录' : 'No purchase history'}</p>}
          {recent.slice(0, 5).map((r, i) => (
            <div key={i} className="data-block flex items-center justify-between text-xs font-black">
              <span className="truncate pr-2">{isZh ? `${r.address} 购买` : `${r.address} bought`}</span>
              <span className="text-accent">T{r.tier}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Shop;
