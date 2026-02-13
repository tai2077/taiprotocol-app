import React, { useEffect, useMemo, useState } from 'react';
import { AppLocale } from '../lib/format';
import { DepositGoal } from '../types';
import { api } from '../lib/api';

interface AchievementsProps {
  locale: AppLocale;
  walletAddress: string | null;
  goals: DepositGoal[];
  points: number;
}

type AchievementState = 'unlocked' | 'locked' | 'coming';

const Achievements: React.FC<AchievementsProps> = ({ locale, walletAddress, goals, points }) => {
  const isZh = locale === 'zh';
  const [inviteCount, setInviteCount] = useState(0);
  const [missionProgress, setMissionProgress] = useState<Awaited<ReturnType<typeof api.getMissionProgress>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncUnavailable, setSyncUnavailable] = useState(false);

  useEffect(() => {
    if (!walletAddress) {
      setInviteCount(0);
      setMissionProgress(null);
      setSyncUnavailable(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    Promise.allSettled([api.getClaimable(walletAddress), api.getMissionProgress(walletAddress)])
      .then(([claimRes, missionRes]) => {
        if (cancelled) return;
        if (claimRes.status === 'fulfilled') {
          setInviteCount(Number(claimRes.value?.inviteCount || 0));
        } else {
          setInviteCount(0);
        }
        if (missionRes.status === 'fulfilled') {
          setMissionProgress(missionRes.value);
          setSyncUnavailable(false);
        } else {
          setMissionProgress(null);
          setSyncUnavailable(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  const achievements = useMemo(
    () => {
      const signedInDays = missionProgress?.progress.signInDays || 0;
      const hasClaimedGoal = goals.some((goal) => goal.claimed);
      const hasCreatedGoal = goals.length > 0;
      const milestoneByPoints = points >= 9000;

      const items: Array<{ name: string; desc: string; state: AchievementState; score: string; tier: string }> = [
        {
          name: isZh ? '首次创建目标' : 'Create First Goal',
          desc: isZh ? '完成第一笔目标锁定' : 'Lock your first deposit goal',
          state: hasCreatedGoal ? 'unlocked' : 'locked',
          score: '+120',
          tier: 'S1',
        },
        {
          name: isZh ? '完成一次补存' : 'Complete One Top-up',
          desc: isZh ? '对任意目标完成补存一次（待接入专用事件）' : 'Top up any goal once (pending dedicated event integration)',
          state: 'coming',
          score: '+180',
          tier: 'S1',
        },
        {
          name: isZh ? '邀请 3 位好友' : 'Invite 3 Friends',
          desc: isZh ? '完成 3 位有效邀请关系' : 'Reach 3 successful invites',
          state: inviteCount >= 3 ? 'unlocked' : 'locked',
          score: '+260',
          tier: 'S2',
        },
        {
          name: isZh ? '连续 30 天打卡' : '30-Day Check-in',
          desc: isZh ? '连续完成 30 天任务打卡' : 'Keep a 30-day mission streak',
          state: missionProgress ? (signedInDays >= 30 ? 'unlocked' : 'locked') : walletAddress ? 'coming' : 'locked',
          score: '+500',
          tier: 'S3',
        },
        {
          name: isZh ? '达成 1 个存款目标' : 'Reach 1 Deposit Goal',
          desc: isZh ? '至少完成一个目标领取' : 'Claim at least one completed goal',
          state: hasClaimedGoal ? 'unlocked' : 'locked',
          score: '+680',
          tier: 'S3',
        },
        {
          name: isZh ? '小队人数突破 10' : 'Team Reaches 10',
          desc: isZh ? '邀请网络达到 10 人，或积分达到 Pro' : 'Reach 10 invites or Pro points tier',
          state: inviteCount >= 10 || milestoneByPoints ? 'unlocked' : 'locked',
          score: '+900',
          tier: 'S4',
        },
      ];
      return items;
    },
    [isZh, inviteCount, missionProgress, walletAddress, goals, points]
  );

  const unlockedCount = achievements.filter((item) => item.state === 'unlocked').length;
  const comingSoonCount = achievements.filter((item) => item.state === 'coming').length;
  const trackableCount = achievements.filter((item) => item.state !== 'coming').length;
  const progress = trackableCount > 0 ? Math.round((unlockedCount / trackableCount) * 100) : 0;

  return (
    <div className="page-view">
      <div className="hero-card p-6">
        <div>
          <p className="section-kicker">{isZh ? '徽章墙' : 'Badge Wall'}</p>
          <p className="text-[11px] font-bold text-white/60 mt-2">
            {isZh ? '完成训练与成长路径，逐步解锁徽章。' : 'Complete growth milestones to unlock badges.'}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="imperial-data rounded-xl px-2.5 py-2">
              <p className="text-[9px] font-bold text-white/60">{isZh ? '已解锁' : 'Unlocked'}</p>
              <p className="text-sm font-black">{unlockedCount}</p>
            </div>
            <div className="imperial-data rounded-xl px-2.5 py-2">
              <p className="text-[9px] font-bold text-white/60">{isZh ? '总数量' : 'Total'}</p>
              <p className="text-sm font-black">{achievements.length}</p>
            </div>
            <div className="imperial-deep rounded-xl px-2.5 py-2">
              <p className="text-[9px] font-bold">{isZh ? '可核验完成度' : 'Verified Progress'}</p>
              <p className="text-sm font-black">{progress}%</p>
            </div>
          </div>
          <p className="text-[10px] font-bold text-white/55 mt-2">
            {isZh ? `待接入项 ${comingSoonCount}` : `Coming Soon ${comingSoonCount}`}
          </p>
          <div className="mt-3 imperial-progress-track">
            <div className="imperial-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {loading && (
        <div className="neo-card p-3 text-xs font-black text-white/60">
          {isZh ? '正在同步成就状态...' : 'Syncing achievements...'}
        </div>
      )}
      {syncUnavailable && walletAddress && (
        <div className="neo-card p-3 text-xs font-black text-white/60 border border-[#cfac56]/35">
          {isZh
            ? '部分成就依赖任务服务，当前显示为待接入。'
            : 'Some achievements depend on mission service and are currently marked as coming soon.'}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {achievements.map((item) => (
          <div
            key={item.name}
            className={`p-4 rounded-2xl border ${
              item.state === 'unlocked'
                ? 'bg-primary/95 text-white border-primary/45'
                : item.state === 'coming'
                  ? 'imperial-data text-white border-[#cfac56]/25'
                  : 'neo-card text-white border-accent/20'
            } hover-lift`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${item.state === 'unlocked' ? 'imperial-deep text-accent' : 'bg-black/10 text-white/60'}`}>
                {item.tier}
              </span>
              <span className="text-[10px] font-black opacity-70">{item.score}</span>
            </div>
            <p className="font-black text-xs mt-3 leading-snug">{item.name}</p>
            <p className="text-[10px] font-bold mt-1 opacity-70">{item.desc}</p>
            <p className="text-[10px] font-black mt-3">
              {item.state === 'unlocked'
                ? (isZh ? '已解锁' : 'Unlocked')
                : item.state === 'coming'
                  ? (isZh ? '即将上线' : 'Coming Soon')
                  : (isZh ? '未解锁' : 'Locked')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Achievements;
