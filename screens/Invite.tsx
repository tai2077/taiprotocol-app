import React, { useEffect, useMemo, useState } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useToast } from '../components/ToastProvider';
import { MARKETING_VAULT } from '../lib/config';
import { inviteShareText } from '../lib/brand';
import { AppLocale, formatTai, toTaiNumber } from '../lib/format';
import { buildMarketingClaimPayload } from '../lib/tx';
import { queryKeys } from '../lib/queryKeys';
import { useTonProofAuth } from '../lib/hooks/useTonProofAuth';
import { connectWalletPreferInjected } from '../lib/walletConnect';
import { isMainnetWallet, mainnetOnlyMessage } from '../lib/walletNetwork';
import PointsTabs from '../components/PointsTabs';
import WorldLightMap from '../components/WorldLightMap';
import TeamList from '../components/TeamList';
import InviteSourceCard from '../components/InviteSourceCard';

interface InviteProps {
  walletAddress: string | null;
  locale: AppLocale;
}

const Invite: React.FC<InviteProps> = ({ walletAddress, locale }) => {
  const isZh = locale === 'zh';
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const { reconnectForTonProof, getTonProofHeader, humanizeClaimError } = useTonProofAuth(walletAddress, locale);
  const [claiming, setClaiming] = useState(false);
  const [copiedFlash, setCopiedFlash] = useState(false);

  const statsQuery = useQuery({
    queryKey: walletAddress ? queryKeys.inviteStats(walletAddress) : ['invite-stats', 'guest'],
    queryFn: () => api.getInviteStats(walletAddress || ''),
    enabled: Boolean(walletAddress),
    staleTime: 20_000,
  });

  const claimableQuery = useQuery({
    queryKey: walletAddress ? queryKeys.inviteClaimable(walletAddress) : ['invite-claimable', 'guest'],
    queryFn: () => api.getInviteClaimable(walletAddress || ''),
    enabled: Boolean(walletAddress),
    staleTime: 20_000,
  });

  const teamQuery = useQuery({
    queryKey: walletAddress ? queryKeys.inviteTeam(walletAddress) : ['invite-team', 'guest'],
    queryFn: () => api.getInviteTeam(walletAddress || '', 2),
    enabled: Boolean(walletAddress),
    staleTime: 20_000,
  });

  const sourceQuery = useQuery({
    queryKey: walletAddress ? queryKeys.inviteSource(walletAddress) : ['invite-source', 'guest'],
    queryFn: () => api.getInviteSource(walletAddress || ''),
    enabled: Boolean(walletAddress),
    staleTime: 20_000,
  });

  const mapQuery = useQuery({
    queryKey: walletAddress ? queryKeys.inviteMap(walletAddress) : ['invite-map', 'guest'],
    queryFn: () => api.getInviteMap(walletAddress || ''),
    enabled: Boolean(walletAddress),
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!walletAddress || !statsQuery.error) return;
    notify(isZh ? '邀请数据暂不可用' : 'Invite data is temporarily unavailable', 'error');
  }, [walletAddress, statsQuery.error, notify, isZh]);

  const refreshInviteData = async () => {
    if (!walletAddress) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.inviteStats(walletAddress) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.inviteClaimable(walletAddress) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.inviteTeam(walletAddress) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.inviteSource(walletAddress) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.inviteMap(walletAddress) }),
    ]);
  };

  const stats = statsQuery.data || null;
  const claimable = claimableQuery.data || null;
  const team = teamQuery.data || null;
  const source = sourceQuery.data || null;
  const mapData = mapQuery.data || null;

  const loading = Boolean(walletAddress) && (statsQuery.isLoading || statsQuery.isFetching);
  const claimLoading = Boolean(walletAddress) && (claimableQuery.isLoading || claimableQuery.isFetching);
  const teamLoading = Boolean(walletAddress) && (teamQuery.isLoading || teamQuery.isFetching);
  const mapLoading = Boolean(walletAddress) && (mapQuery.isLoading || mapQuery.isFetching);
  const sourceLoading = Boolean(walletAddress) && (sourceQuery.isLoading || sourceQuery.isFetching);

  const fallbackCode = walletAddress ? walletAddress.slice(0, 8).toUpperCase() : '';
  const link = stats?.inviteLink || (fallbackCode
    ? `https://mini.tai.lat/sale?ref=${fallbackCode}`
    : isZh ? '请先连接钱包' : 'Connect wallet first');
  const canShare = Boolean(walletAddress && /^https?:\/\//.test(link));

  const copyLink = async () => {
    if (!canShare) {
      notify(isZh ? '请先连接钱包后再分享邀请链接' : 'Connect wallet before sharing invite link', 'info');
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      notify(isZh ? '邀请链接已复制' : 'Invite link copied', 'success');
      setCopiedFlash(true);
      window.setTimeout(() => setCopiedFlash(false), 520);
    } catch {
      notify(isZh ? '复制失败' : 'Copy failed', 'error');
    }
  };

  const inviteCount = stats?.inviteCount || 0;
  const rebateTai = Number(stats?.totalInviteRewardsTai || 0);
  const claimableTai = toTaiNumber(claimable?.pendingTotalTai || 0);
  const claimViaInviteRoute = claimable?.source !== 'marketing';
  const canClaimInvite = Boolean(walletAddress) && claimViaInviteRoute && claimableTai > 0 && !claiming && !claimLoading;
  const rebateMultiplier = (stats?.multiplierBp || 10000) / 10000;
  const teamLevel = inviteCount >= 20
    ? (isZh ? '军团' : 'Legion')
    : inviteCount >= 8
      ? (isZh ? '战队' : 'Squad')
      : inviteCount >= 3
        ? (isZh ? '小队' : 'Team')
        : (isZh ? '新兵' : 'Rookie');

  const teamSize = (team?.stats.directCount || inviteCount) + (team?.stats.indirectCount || 0);
  const viralScore = Math.min(999, teamSize * 12 + inviteCount * 15 + (rebateTai > 0 ? 40 : 0));

  const milestone = useMemo(() => {
    const steps = [1, 3, 6, 12, 20];
    const next = steps.find((item) => inviteCount < item) ?? null;
    if (!next) {
      return {
        label: isZh ? '已达最高阶梯' : 'Top tier reached',
        progress: 100,
        remain: 0,
      };
    }
    return {
      label: isZh ? `再邀请 ${next - inviteCount} 人解锁下一档` : `${next - inviteCount} more invites to next tier`,
      progress: Math.max(0, Math.min(100, Math.round((inviteCount / next) * 100))),
      remain: next - inviteCount,
    };
  }, [inviteCount, isZh]);

  const claimInviteReward = async () => {
    if (!walletAddress) {
      await connectWalletPreferInjected(tonConnectUI);
      return;
    }
    if (!isMainnetWallet(wallet)) {
      notify(mainnetOnlyMessage(locale), 'error');
      return;
    }
    if (!claimViaInviteRoute) {
      notify(
        isZh
          ? '当前为旧营销奖励来源，请联系管理员迁移到新版领取接口。'
          : 'Current source is legacy marketing rewards. Please migrate to the v2 claim route.',
        'info'
      );
      return;
    }
    if (claimableTai <= 0) {
      notify(isZh ? '当前没有可领取邀请奖励。' : 'No invite rewards available to claim.', 'info');
      return;
    }

    const tonProofHeader = getTonProofHeader();
    if (!tonProofHeader) {
      notify(
        isZh
          ? '领取前需完成 TON Proof 授权，请重新连接钱包。'
          : 'Ton Proof is required before claiming. Please reconnect wallet.',
        'info'
      );
      await reconnectForTonProof();
      return;
    }

    setClaiming(true);
    try {
      const signed = await api.claimInvite({ walletAddress }, tonProofHeader);
      if (!signed.amount || !signed.nonce || !signed.signature || !signed.deadline) {
        notify(isZh ? '签名数据不完整，请检查后端返回。' : 'Incomplete signature payload from backend.', 'error');
        return;
      }

      const payload = buildMarketingClaimPayload({
        amount: signed.amount,
        nonce: signed.nonce,
        deadline: signed.deadline,
        signature: signed.signature,
      });

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
          {
            address: MARKETING_VAULT,
            amount: '80000000',
            payload,
          },
        ],
      });

      notify(
        isZh
          ? `邀请奖励领取交易已提交：${formatTai(toTaiNumber(signed.amount), locale)}`
          : `Invite claim submitted: ${formatTai(toTaiNumber(signed.amount), locale)}`,
        'success'
      );
      await refreshInviteData();
    } catch (error) {
      const raw = error instanceof Error ? error.message : '';
      notify(
        humanizeClaimError(raw, {
          noRewardsCode: 'NO_REWARDS_TO_CLAIM',
          noRewardsZh: '当前没有可领取邀请奖励。',
          noRewardsEn: 'No invite rewards available to claim.',
          defaultZh: '领取失败，请稍后重试。',
          defaultEn: 'Claim failed. Please retry.',
        }),
        'error'
      );
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="page-view">
      <PointsTabs locale={locale} />

      <div className="hero-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="section-kicker">{isZh ? '邀请指挥台' : 'Invite Command Center'}</p>
            <p className="text-xs font-bold text-white/65 mt-2">
              {isZh
                ? '直推 + 间推统一看板，实时追踪点亮地图与奖励累积。'
                : 'Unified direct + indirect dashboard with real-time map coverage and reward tracking.'}
            </p>
          </div>
          <span className="imperial-chip imperial-chip-primary">
            {teamLevel}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="imperial-data rounded-xl px-3 py-2">
            <p className="text-[10px] font-bold text-white/60">{isZh ? '返利倍率' : 'Rebate Multiplier'}</p>
            <p className="text-lg font-black number-display mt-0.5">{rebateMultiplier.toFixed(2)}x</p>
          </div>
          <div className="imperial-data rounded-xl px-3 py-2">
            <p className="text-[10px] font-bold text-white/60">{isZh ? '病毒指数' : 'Viral Score'}</p>
            <p className="text-lg font-black number-display mt-0.5">{loading ? '...' : viralScore}</p>
          </div>
          <div className="imperial-data rounded-xl px-3 py-2">
            <p className="text-[10px] font-bold text-white/60">{isZh ? '队伍规模' : 'Team Size'}</p>
            <p className="text-lg font-black number-display mt-0.5">{teamLoading ? '...' : teamSize}</p>
          </div>
          <div className="imperial-data rounded-xl px-3 py-2">
            <p className="text-[10px] font-bold text-white/60">{isZh ? '地图覆盖' : 'Coverage'}</p>
            <p className="text-lg font-black number-display mt-0.5">{mapLoading ? '...' : mapData?.coverage || 0}</p>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] font-black text-white/60">
            <p>{isZh ? '下一里程碑' : 'Next Milestone'}</p>
            <p>{milestone.progress}%</p>
          </div>
          <div className="mt-1.5 imperial-progress-track">
            <div className="imperial-progress-fill" style={{ width: `${milestone.progress}%` }} />
          </div>
          <p className="mt-1.5 text-[10px] font-bold text-white/60">{milestone.label}</p>
        </div>
      </div>

      <WorldLightMap locale={locale} data={mapData} loading={mapLoading} />

      <div
        className="neo-card p-4"
        style={copiedFlash ? { boxShadow: '0 0 0 4px rgba(207,172,86,0.18), 0 18px 34px -10px rgba(0,0,0,0.52)' } : undefined}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="section-kicker">{isZh ? '邀请链接' : 'Invite Link'}</p>
          <span className="imperial-chip imperial-chip-accent">
            {isZh ? 'Mini App 入口' : 'Mini App Entry'}
          </span>
        </div>
        <p className="text-xs font-black break-all mt-2 text-white/75">{link}</p>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            className="w-full tai-btn tai-btn-primary hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={copyLink}
            disabled={!canShare}
          >
            {isZh ? '复制链接' : 'Copy Link'}
          </button>
          <a
            className={`w-full tai-btn tai-btn-accent hover-lift ${!canShare ? 'opacity-50 pointer-events-none' : ''}`}
            href={
              canShare
                ? `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(inviteShareText(locale))}`
                : undefined
            }
            target="_blank"
            rel="noreferrer noopener"
            aria-disabled={!canShare}
          >
            {isZh ? '分享 TG' : 'Share TG'}
          </a>
        </div>
      </div>

      <div className="neo-card p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="section-kicker">{isZh ? '邀请奖励领取' : 'Invite Reward Claim'}</p>
          <span className={`imperial-chip ${canClaimInvite ? 'imperial-chip-primary' : 'imperial-chip-muted'}`}>
            {canClaimInvite ? (isZh ? '可领取' : 'Claimable') : (isZh ? '暂无' : 'None')}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="imperial-data rounded-xl px-3 py-2">
            <p className="text-[10px] font-bold text-white/60">{isZh ? '可领取奖励' : 'Claimable Reward'}</p>
            <p className="text-base font-black number-display">{claimLoading ? '...' : formatTai(claimableTai, locale)}</p>
          </div>
          <div className="imperial-data rounded-xl px-3 py-2">
            <p className="text-[10px] font-bold text-white/60">{isZh ? '累计返利' : 'Total Rebate'}</p>
            <p className="text-base font-black number-display">{loading ? '...' : stats?.totalInviteRewardsTai || '0'} TAI</p>
          </div>
        </div>
        <button
          className={`w-full mt-3 tai-btn ${canClaimInvite ? 'tai-btn-primary' : 'tai-btn-soft opacity-60 cursor-not-allowed'}`}
          onClick={claimInviteReward}
          disabled={!canClaimInvite}
        >
          {claiming ? (isZh ? '领取中...' : 'Claiming...') : (isZh ? '领取邀请 TAI' : 'Claim Invite TAI')}
        </button>
        {!claimViaInviteRoute && (
          <p className="text-[10px] font-bold text-white/55 mt-2">
            {isZh
              ? '当前账户走旧营销来源，需迁移后才能使用新版链上领取。'
              : 'Current account uses legacy marketing source and needs migration to v2 claiming.'}
          </p>
        )}
        <p className="text-[10px] font-bold text-white/55 mt-2">
          {isZh ? '领取需用户自费 Gas（约 0.08 TON）' : 'Claim requires user-paid gas (~0.08 TON).'}
        </p>
      </div>

      <TeamList locale={locale} team={team} loading={teamLoading} />

      <InviteSourceCard locale={locale} source={source} loading={sourceLoading} />

      {!walletAddress && (
        <div className="neo-card p-4 border border-neon-orange/35">
          <p className="text-[11px] font-black text-white/75">
            {isZh
              ? '连接钱包后可生成专属邀请链接并查看完整队员网络。'
              : 'Connect wallet to unlock your invite link and team network insights.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Invite;
