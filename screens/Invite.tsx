import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useToast } from '../components/ToastProvider';
import { AppLocale } from '../lib/format';

interface InviteProps {
  walletAddress: string | null;
  locale: AppLocale;
}

const Invite: React.FC<InviteProps> = ({ walletAddress, locale }) => {
  const isZh = locale === 'zh';
  const { notify } = useToast();
  const [stats, setStats] = useState<Awaited<ReturnType<typeof api.getInviteStats>> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!walletAddress) return;
    setLoading(true);
    api
      .getInviteStats(walletAddress)
      .then((d) => setStats(d || null))
      .catch(() => {
        setStats(null);
        notify(isZh ? '邀请数据暂不可用' : 'Invite data is temporarily unavailable', 'error');
      })
      .finally(() => setLoading(false));
  }, [walletAddress, notify, isZh]);

  const link = stats?.inviteLink || (walletAddress
    ? `https://t.me/taitoken_bot?startapp=ref_${walletAddress.slice(0, 8).toUpperCase()}`
    : isZh ? '请先连接钱包' : 'Connect wallet first');

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      notify(isZh ? '邀请链接已复制' : 'Invite link copied', 'success');
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
    <div className="flex-1 flex flex-col safe-content-bottom p-4 gap-4 animate-in fade-in duration-300 grid-background">
      <div className="neo-card-dark p-5 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-neon-orange/20 blur-3xl" />
        <div className="relative z-10">
          <p className="section-kicker text-accent">{isZh ? '裂变加速器' : 'Invite Accelerator'}</p>
          <h2 className="text-3xl font-black tracking-tight mt-1">{isZh ? '邀请你的小队' : 'Invite Your Crew'}</h2>
          <p className="text-xs font-bold text-white/75 mt-2">
            {isZh
              ? '邀请会提高任务解锁速度，并带来额外返利。'
              : 'Invites boost mission unlock speed and add extra rebate rewards.'}
          </p>

          <div className="mt-4 grid grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <p className="text-[10px] font-bold text-white/60">{isZh ? '当前返利倍率' : 'Current Rebate Multiplier'}</p>
              <p className="text-4xl font-black leading-none text-gradient-accent">{rebateMultiplier.toFixed(2)}x</p>
            </div>
            <div className="bg-primary text-bg-dark brutal-border-thin px-3 py-2 rounded-xl text-right min-w-[98px]">
              <p className="text-[10px] font-black">{isZh ? '队伍等级' : 'Team Level'}</p>
              <p className="text-base font-black">{teamLevel}</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[10px] font-black text-white/70">
              <p>{isZh ? '下一里程碑' : 'Next Milestone'}</p>
              <p>{milestone.progress}%</p>
            </div>
            <div className="mt-1.5 h-3 bg-white/10 brutal-border-thin rounded-full overflow-hidden p-[1px]">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${milestone.progress}%` }} />
            </div>
            <p className="mt-1.5 text-[10px] font-bold text-white/70">{milestone.label}</p>
          </div>
        </div>
      </div>

      {!walletAddress && (
        <div className="neo-card p-4 border border-neon-orange/35">
          <p className="text-[11px] font-black text-black/75">
            {isZh
              ? '连接钱包后可生成你的专属邀请链接并统计返利。'
              : 'Connect wallet to generate your referral link and track rebate rewards.'}
          </p>
        </div>
      )}

      <div className="neo-card p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="section-kicker">{isZh ? '邀请链接' : 'Invite Link'}</p>
          <span className="text-[10px] font-black px-2 py-1 rounded-full bg-primary/15 border border-primary/30">
            {isZh ? '机器人入口' : 'Bot Entry'}
          </span>
        </div>
        <p className="text-xs font-black break-all mt-2 text-black/75">{link}</p>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            className="w-full tai-btn tai-btn-primary hover-lift"
            onClick={copyLink}
          >
            {isZh ? '复制链接' : 'Copy Link'}
          </button>
          <a
            className="w-full tai-btn tai-btn-accent hover-lift"
            href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(isZh ? '加入 TAI 协议，一起练成钻石手' : 'Join TAI Protocol and become diamond hands together.')}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            {isZh ? '分享 TG' : 'Share TG'}
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="neo-card p-3.5">
          <p className="section-kicker">{isZh ? '累计邀请' : 'Total Invites'}</p>
          <p className="text-xl font-black mt-1">{loading ? '...' : inviteCount}</p>
        </div>
        <div className="neo-card p-3.5">
          <p className="section-kicker">{isZh ? '返利 TAI' : 'Rebate TAI'}</p>
          <p className="text-xl font-black mt-1">{loading ? '...' : stats?.totalInviteRewardsTai || '0'}</p>
        </div>
        <div className="neo-card p-3.5">
          <p className="section-kicker">{isZh ? '病毒指数' : 'Viral Score'}</p>
          <p className="text-xl font-black mt-1">{loading ? '...' : viralScore}</p>
        </div>
        <div className="neo-card p-3.5">
          <p className="section-kicker">{isZh ? '下一档差额' : 'To Next Tier'}</p>
          <p className="text-xl font-black mt-1">{loading ? '...' : milestone.remain}</p>
        </div>
      </div>

      <div className="neo-card-dark p-4">
        <p className="section-kicker text-accent">{isZh ? '裂变任务路径' : 'Invite Mission Path'}</p>
        <div className="mt-3 space-y-2.5">
          {[
            { label: isZh ? '邀请 1 位好友注册' : 'Invite 1 friend to register', done: inviteCount >= 1 },
            { label: isZh ? '邀请 3 位好友创建目标' : 'Invite 3 friends to create goals', done: inviteCount >= 3 },
            { label: isZh ? '邀请 10 位好友加入小队' : 'Invite 10 friends into your crew', done: inviteCount >= 10 },
          ].map((item) => (
            <div key={item.label} className="bg-white/8 brutal-border-thin rounded-xl px-3 py-2.5 flex items-center justify-between gap-3">
              <p className="text-[11px] font-black">{item.label}</p>
              <span className={`text-[10px] font-black rounded-full px-2.5 py-1 ${item.done ? 'bg-primary text-bg-dark' : 'bg-white text-black'}`}>
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
