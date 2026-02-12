import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';
import { useToast } from '../components/ToastProvider';
import { AppLocale } from '../lib/format';
import PointsTabs from '../components/PointsTabs';

interface InviteProps {
  walletAddress: string | null;
  locale: AppLocale;
}

const Invite: React.FC<InviteProps> = ({ walletAddress, locale }) => {
  const isZh = locale === 'zh';
  const { notify } = useToast();
  const [stats, setStats] = useState<Awaited<ReturnType<typeof api.getInviteStats>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedFlash, setCopiedFlash] = useState(false);
  const notifyRef = useRef(notify);
  const isZhRef = useRef(isZh);

  useEffect(() => {
    notifyRef.current = notify;
    isZhRef.current = isZh;
  }, [notify, isZh]);

  useEffect(() => {
    if (!walletAddress) {
      setStats(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .getInviteStats(walletAddress)
      .then((d) => setStats(d || null))
      .catch(() => {
        setStats(null);
        notifyRef.current(isZhRef.current ? '邀请数据暂不可用' : 'Invite data is temporarily unavailable', 'error');
      })
      .finally(() => setLoading(false));
  }, [walletAddress]);

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
  const rebateMultiplier = (stats?.multiplierBp || 10000) / 10000;
  const teamLevel = inviteCount >= 20
    ? (isZh ? '军团' : 'Legion')
    : inviteCount >= 8
      ? (isZh ? '战队' : 'Squad')
      : inviteCount >= 3
        ? (isZh ? '小队' : 'Team')
        : (isZh ? '新兵' : 'Rookie');
  const viralScore = Math.min(999, inviteCount * 27 + (rebateTai > 0 ? 40 : 0));

  const milestone = useMemo(() => {
    const steps = [1, 3, 10, 20];
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

  return (
    <div className="page-view">
      <PointsTabs locale={locale} />
      <div className="hero-card p-6">
        <div>
          <p className="section-kicker">{isZh ? '裂变加速器' : 'Invite Accelerator'}</p>
          <p className="text-xs font-bold text-white/60 mt-2">
            {isZh ? '分享链接并完成绑定后，返利与任务加速自动累计。' : 'Share your link and bind invites to auto-accumulate rebates and boosts.'}
          </p>

          <div className="mt-4 grid grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <p className="text-[10px] font-bold text-white/60">{isZh ? '当前返利倍率' : 'Current Rebate Multiplier'}</p>
              <p className="text-4xl font-black leading-none number-display">
                <span
                  style={{
                    background: 'linear-gradient(180deg, #ffe4a0 0%, #f6df9a 30%, #cfac56 70%, #a68b3d 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {rebateMultiplier.toFixed(2)}
                </span>
                <span className="text-lg text-white/60 ml-1">x</span>
              </p>
            </div>
            <div
              className="imperial-deep px-3 py-2 rounded-xl text-right min-w-[98px]"
              style={{
                borderColor: 'rgba(200,16,46,0.45)',
                boxShadow: '0 0 0 1px rgba(200,16,46,0.1) inset, 0 8px 16px rgba(0,0,0,0.4)',
              }}
            >
              <p className="text-[10px] font-black">{isZh ? '队伍等级' : 'Team Level'}</p>
              <p
                className="text-base font-black"
                style={{
                  background: 'linear-gradient(180deg, #ff4d6a 0%, #c8102e 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {teamLevel}
              </p>
            </div>
          </div>

          <div className="mt-4">
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
      </div>

      {!walletAddress && (
        <div className="neo-card p-4 border border-neon-orange/35">
          <p className="text-[11px] font-black text-white/75">
            {isZh
              ? '连接钱包后可生成你的专属邀请链接并统计返利。'
              : 'Connect wallet to generate your referral link and track rebate rewards.'}
          </p>
        </div>
      )}

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
                ? `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(isZh ? '加入 TAI 协议，一起练成钻石手' : 'Join TAI Protocol and become diamond hands together.')}`
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

      <div className="grid grid-cols-2 gap-3">
        <div className="neo-card p-3.5">
          <p className="section-kicker">{isZh ? '累计邀请' : 'Total Invites'}</p>
          <p className="text-xl font-black mt-1 number-display">{loading ? '...' : inviteCount}</p>
        </div>
        <div className="neo-card p-3.5">
          <p className="section-kicker">{isZh ? '返利 TAI' : 'Rebate TAI'}</p>
          <p className="text-xl font-black mt-1 number-display">{loading ? '...' : stats?.totalInviteRewardsTai || '0'}</p>
        </div>
        <div className="neo-card p-3.5">
          <p className="section-kicker">{isZh ? '病毒指数' : 'Viral Score'}</p>
          <p className="text-xl font-black mt-1 number-display">{loading ? '...' : viralScore}</p>
        </div>
        <div className="neo-card p-3.5">
          <p className="section-kicker">{isZh ? '下一档差额' : 'To Next Tier'}</p>
          <p className="text-xl font-black mt-1 number-display">{loading ? '...' : milestone.remain}</p>
        </div>
      </div>

      <div className="neo-card p-4">
        <p className="section-kicker">{isZh ? '裂变任务路径' : 'Invite Mission Path'}</p>
        <div className="mt-3 space-y-2.5">
          {[
            { label: isZh ? '邀请 1 位好友注册' : 'Invite 1 friend to register', done: inviteCount >= 1 },
            { label: isZh ? '邀请 3 位好友创建目标' : 'Invite 3 friends to create goals', done: inviteCount >= 3 },
            { label: isZh ? '邀请 10 位好友加入小队' : 'Invite 10 friends into your crew', done: inviteCount >= 10 },
          ].map((item) => (
            <div key={item.label} className="imperial-data rounded-xl px-3 py-2.5 flex items-center justify-between gap-3">
              <p className="text-[11px] font-black">{item.label}</p>
              <span className={`imperial-chip ${item.done ? 'imperial-chip-primary' : 'imperial-chip-muted'}`}>
                {item.done ? (isZh ? '已完成' : 'Done') : (isZh ? '进行中' : 'In Progress')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Invite;
