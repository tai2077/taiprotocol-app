import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { AppLocale, formatTai } from '../lib/format';
import { buildTextPayload } from '../lib/tx';
import { useToast } from '../components/ToastProvider';
import {
  buildFixedStakeTransferTx,
  FixedStakingOverview,
  FixedStakeUserState,
  getFixedStakingOverview,
  getFixedStakeUserState,
} from '../lib/fixedStaking';
import { FIXED_STAKING_CONTRACT } from '../lib/config';

interface FixedStakeProps {
  walletAddress: string | null;
  locale: AppLocale;
}

const MIN_STAKE_TAI = 10_000;

function formatDuration(seconds: number, locale: AppLocale): string {
  const safe = Math.max(0, Math.floor(seconds));
  const days = Math.floor(safe / 86400);
  const hours = Math.floor((safe % 86400) / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  return locale === 'zh' ? `${days}天 ${hours}小时 ${minutes}分` : `${days}d ${hours}h ${minutes}m`;
}

const FixedStake: React.FC<FixedStakeProps> = ({ walletAddress, locale }) => {
  const isZh = locale === 'zh';
  const [tonConnectUI] = useTonConnectUI();
  const { notify } = useToast();

  const [overview, setOverview] = useState<FixedStakingOverview | null>(null);
  const [userState, setUserState] = useState<FixedStakeUserState | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stakeAmountTai, setStakeAmountTai] = useState('10000');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const base = await getFixedStakingOverview();
      setOverview(base);
      if (walletAddress) {
        const user = await getFixedStakeUserState(walletAddress);
        setUserState(user);
      } else {
        setUserState(null);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      notify(
        isZh ? `固定质押信息读取失败${msg ? `: ${msg}` : ''}` : `Failed to load fixed staking info${msg ? `: ${msg}` : ''}`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [walletAddress, notify, isZh]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const canStake = useMemo(() => {
    if (!overview?.isStakeWindowOpen) return false;
    const value = Number(stakeAmountTai.replace(/,/g, ''));
    return Number.isFinite(value) && value >= MIN_STAKE_TAI;
  }, [overview?.isStakeWindowOpen, stakeAmountTai]);

  const doStake = async () => {
    if (!walletAddress) {
      await tonConnectUI.openModal();
      return;
    }
    if (!overview?.isStakeWindowOpen) {
      notify(isZh ? '固定质押窗口已关闭' : 'Fixed staking window is closed', 'info');
      return;
    }
    if (!canStake) {
      notify(isZh ? `最小质押为 ${MIN_STAKE_TAI.toLocaleString('zh-CN')} TAI` : `Minimum stake is ${MIN_STAKE_TAI.toLocaleString('en-US')} TAI`, 'error');
      return;
    }
    try {
      setSubmitting(true);
      const tx = await buildFixedStakeTransferTx(walletAddress, stakeAmountTai);
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{ address: tx.to, amount: tx.tonAmount, payload: tx.payload }],
      });
      notify(isZh ? '固定质押交易已发送，请等待链上确认。' : 'Fixed stake transaction sent. Wait for chain confirmation.', 'success');
      window.setTimeout(() => {
        void refresh();
      }, 2000);
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      notify(isZh ? `质押失败${msg ? `: ${msg}` : ''}` : `Staking failed${msg ? `: ${msg}` : ''}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const sendClaim = async (claimType: 'ClaimPrincipal' | 'ClaimReward' | 'Claim') => {
    if (!walletAddress) {
      await tonConnectUI.openModal();
      return;
    }
    try {
      setSubmitting(true);
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
          {
            address: FIXED_STAKING_CONTRACT,
            amount: '200000000',
            payload: buildTextPayload(claimType),
          },
        ],
      });
      notify(isZh ? '领取交易已发送，请等待链上确认。' : 'Claim transaction sent. Wait for chain confirmation.', 'success');
      window.setTimeout(() => {
        void refresh();
      }, 2000);
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      notify(isZh ? `领取失败${msg ? `: ${msg}` : ''}` : `Claim failed${msg ? `: ${msg}` : ''}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-view">
      <div className="hero-card p-6">
        <div>
          <p className="section-kicker">{isZh ? '质押模式' : 'Staking Mode'}</p>
          <h2 className="text-3xl font-black tracking-tight mt-1">{isZh ? '固定质押（模式2）' : 'Fixed Staking (Mode 2)'}</h2>
          <p className="text-xs font-bold text-white/60 mt-2">
            {isZh ? '固定质押窗口由合约控制；领取按轮次执行。' : 'Window is contract-controlled; claims follow round rules.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="imperial-chip imperial-chip-muted">{isZh ? '本金 R12' : 'Principal R12'}</span>
            <span className="imperial-chip imperial-chip-muted">{isZh ? '奖励 R18' : 'Reward R18'}</span>
            <span className="imperial-chip imperial-chip-muted">{isZh ? '灵活质押暂停' : 'Flexible paused'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="neo-card p-4">
          <p className="section-kicker">{isZh ? '窗口状态' : 'Window'}</p>
          <p className="text-sm font-black mt-1">
            {overview?.isStakeWindowOpen ? (isZh ? '开放中' : 'Open') : (isZh ? '已关闭' : 'Closed')}
          </p>
          <p className="text-[10px] font-bold opacity-70 mt-1">
            {overview ? (isZh ? `剩余 ${formatDuration(overview.timeUntilWindowCloseSec, locale)}` : `${formatDuration(overview.timeUntilWindowCloseSec, locale)} left`) : (loading ? (isZh ? '读取中...' : 'Loading...') : '-')}
          </p>
        </div>
        <div className="neo-card p-4">
          <p className="section-kicker">{isZh ? '当前轮次' : 'Round'}</p>
          <p className="text-sm font-black mt-1">{overview ? `R${overview.currentRound}` : '-'}</p>
          <p className="text-[10px] font-bold opacity-70 mt-1">
            {overview
              ? (isZh
                  ? `本金R${overview.principalUnlockRound} · 奖励R${overview.rewardUnlockRound}`
                  : `Principal R${overview.principalUnlockRound} · Reward R${overview.rewardUnlockRound}`)
              : '-'}
          </p>
        </div>
      </div>

      <div className="neo-card p-4">
        <p className="section-kicker">{isZh ? '固定质押参与' : 'Join Fixed Staking'}</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="imperial-data rounded-xl px-3 py-2">
            <p className="text-[10px] font-bold text-white/60">{isZh ? '总质押量' : 'Total Staked'}</p>
            <p className="text-sm font-black">{overview ? formatTai(overview.totalStakedTai, locale) : '-'}</p>
          </div>
          <div className="imperial-data rounded-xl px-3 py-2">
            <p className="text-[10px] font-bold text-white/60">{isZh ? '奖励池余额' : 'Rewards Balance'}</p>
            <p className="text-sm font-black">{overview ? formatTai(overview.rewardsBalanceTai, locale) : '-'}</p>
          </div>
        </div>
        <label className="text-[10px] font-black mt-3 block">{isZh ? '质押数量（TAI）' : 'Stake Amount (TAI)'}</label>
        <input
          className="w-full imperial-data p-3 font-black text-xl rounded-xl mt-1"
          type="number"
          min={MIN_STAKE_TAI}
          value={stakeAmountTai}
          onChange={(e) => setStakeAmountTai(e.target.value)}
        />
        <p className="text-[10px] font-bold opacity-70 mt-1">
          {isZh ? `最小质押 ${MIN_STAKE_TAI.toLocaleString('zh-CN')} TAI` : `Minimum stake ${MIN_STAKE_TAI.toLocaleString('en-US')} TAI`}
        </p>
        <button
          className="w-full tai-btn tai-btn-primary hover-lift mt-3 disabled:opacity-55 disabled:cursor-not-allowed"
          onClick={doStake}
          disabled={!canStake || submitting}
        >
          {submitting ? (isZh ? '提交中...' : 'Submitting...') : isZh ? '参与固定质押' : 'Stake in Fixed Pool'}
        </button>
      </div>

      <div className="neo-card p-4">
        <p className="section-kicker">{isZh ? '我的可领取（固定质押）' : 'My Claimable (Fixed)'}</p>
        {!walletAddress && (
          <p className="text-xs font-bold text-white/65 mt-2">{isZh ? '连接钱包后显示你的质押与可领取金额。' : 'Connect wallet to view your stake and claimable amounts.'}</p>
        )}
        {walletAddress && (
          <>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div className="imperial-data rounded-xl px-2.5 py-2">
                <p className="text-[9px] font-bold text-white/60">{isZh ? '已质押' : 'Staked'}</p>
                <p className="text-xs font-black">{userState?.hasStake ? (isZh ? '是' : 'Yes') : (isZh ? '否' : 'No')}</p>
              </div>
              <div className="imperial-data rounded-xl px-2.5 py-2">
                <p className="text-[9px] font-bold text-white/60">{isZh ? '可领本金' : 'Principal'}</p>
                <p className="text-xs font-black">{formatTai(userState?.claimablePrincipalTai || 0, locale)}</p>
              </div>
              <div className="imperial-data rounded-xl px-2.5 py-2">
                <p className="text-[9px] font-bold text-white/60">{isZh ? '可领奖励' : 'Reward'}</p>
                <p className="text-xs font-black">{formatTai(userState?.claimableRewardTai || 0, locale)}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {/*
                Claim actions are guarded by both contract round gates and user-level claimable amounts
                to avoid sending no-op transactions that still consume network fees.
              */}
              <button
                className="tai-btn tai-btn-soft disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => sendClaim('ClaimPrincipal')}
                disabled={
                  submitting
                  || !overview
                  || !userState?.hasStake
                  || overview.currentRound < (overview.principalUnlockRound || 12)
                  || (userState?.claimablePrincipalTai || 0) <= 0
                }
              >
                {isZh ? '领本金' : 'Principal'}
              </button>
              <button
                className="tai-btn tai-btn-soft disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => sendClaim('ClaimReward')}
                disabled={
                  submitting
                  || !overview?.allRoundsUnlocked
                  || !userState?.hasStake
                  || (userState?.claimableRewardTai || 0) <= 0
                }
              >
                {isZh ? '领奖励' : 'Reward'}
              </button>
              <button
                className="tai-btn tai-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => sendClaim('Claim')}
                disabled={
                  submitting
                  || !overview?.allRoundsUnlocked
                  || !userState?.hasStake
                  || (userState?.claimableTotalTai || 0) <= 0
                }
              >
                {isZh ? '一键领取' : 'Claim All'}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="neo-card p-4">
        <p className="text-[11px] font-black text-white/70 break-all">
          {isZh ? '固定质押合约：' : 'Fixed staking contract: '}
          <span className="font-bold">{overview?.contractAddress || FIXED_STAKING_CONTRACT}</span>
        </p>
        <div className="grid grid-cols-2 gap-2.5 mt-3">
          <Link to="/deposit" className="w-full tai-btn tai-btn-soft hover-lift">
            {isZh ? '回到存款目标' : 'Back to Deposit'}
          </Link>
          <Link to="/unlocks" className="w-full tai-btn tai-btn-dark hover-lift">
            {isZh ? '查看解锁优先购' : 'Unlock Priority'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FixedStake;
