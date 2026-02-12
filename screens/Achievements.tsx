import React from 'react';
import { AppLocale } from '../lib/format';

interface AchievementsProps {
  locale: AppLocale;
}

const Achievements: React.FC<AchievementsProps> = ({ locale }) => {
  const isZh = locale === 'zh';
  const achievements = [
    {
      name: isZh ? '首次创建目标' : 'Create First Goal',
      desc: isZh ? '完成第一笔目标锁定' : 'Lock your first deposit goal',
      unlocked: true,
      score: '+120',
      tier: 'S1',
    },
    {
      name: isZh ? '完成一次补存' : 'Complete One Top-up',
      desc: isZh ? '对任意目标完成补存一次' : 'Top up any goal once',
      unlocked: true,
      score: '+180',
      tier: 'S1',
    },
    {
      name: isZh ? '邀请 3 位好友' : 'Invite 3 Friends',
      desc: isZh ? '完成 3 位有效邀请关系' : 'Reach 3 successful invites',
      unlocked: false,
      score: '+260',
      tier: 'S2',
    },
    {
      name: isZh ? '连续 30 天打卡' : '30-Day Check-in',
      desc: isZh ? '连续完成 30 天任务打卡' : 'Keep a 30-day mission streak',
      unlocked: false,
      score: '+500',
      tier: 'S3',
    },
    {
      name: isZh ? '达成 1 个存款目标' : 'Reach 1 Deposit Goal',
      desc: isZh ? '至少完成一个目标领取' : 'Claim at least one completed goal',
      unlocked: false,
      score: '+680',
      tier: 'S3',
    },
    {
      name: isZh ? '小队人数突破 10' : 'Team Reaches 10',
      desc: isZh ? '邀请网络达到 10 人' : 'Grow referral network to 10',
      unlocked: false,
      score: '+900',
      tier: 'S4',
    },
  ];

  const unlockedCount = achievements.filter((item) => item.unlocked).length;
  const progress = Math.round((unlockedCount / achievements.length) * 100);

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
              <p className="text-[9px] font-bold">{isZh ? '完成度' : 'Progress'}</p>
              <p className="text-sm font-black">{progress}%</p>
            </div>
          </div>
          <div className="mt-3 imperial-progress-track">
            <div className="imperial-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {achievements.map((item) => (
          <div
            key={item.name}
            className={`p-4 rounded-2xl border ${item.unlocked ? 'bg-primary/95 text-white border-primary/45' : 'neo-card text-white border-accent/20'} hover-lift`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${item.unlocked ? 'imperial-deep text-accent' : 'bg-black/10 text-white/60'}`}>
                {item.tier}
              </span>
              <span className="text-[10px] font-black opacity-70">{item.score}</span>
            </div>
            <p className="font-black text-xs mt-3 leading-snug">{item.name}</p>
            <p className="text-[10px] font-bold mt-1 opacity-70">{item.desc}</p>
            <p className="text-[10px] font-black mt-3">
              {item.unlocked ? (isZh ? '已解锁' : 'Unlocked') : (isZh ? '未解锁' : 'Locked')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Achievements;
