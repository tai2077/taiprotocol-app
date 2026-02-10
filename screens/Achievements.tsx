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
    <div className="flex-1 flex flex-col safe-content-bottom p-4 gap-4 animate-in fade-in duration-300 grid-background">
      <div className="neo-card-dark p-5 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-12 -right-10 h-44 w-44 rounded-full bg-primary/18 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-accent/18 blur-3xl" />

        <div className="relative z-10">
          <p className="section-kicker text-accent">{isZh ? '徽章墙' : 'Badge Wall'}</p>
          <h2 className="text-2xl font-black tracking-tight mt-1">{isZh ? '成就' : 'Achievements'}</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="bg-white/10 brutal-border-thin rounded-xl px-2.5 py-2">
              <p className="text-[9px] font-bold text-white/60">{isZh ? '已解锁' : 'Unlocked'}</p>
              <p className="text-sm font-black">{unlockedCount}</p>
            </div>
            <div className="bg-white/10 brutal-border-thin rounded-xl px-2.5 py-2">
              <p className="text-[9px] font-bold text-white/60">{isZh ? '总数量' : 'Total'}</p>
              <p className="text-sm font-black">{achievements.length}</p>
            </div>
            <div className="bg-primary text-bg-dark brutal-border-thin rounded-xl px-2.5 py-2">
              <p className="text-[9px] font-bold">{isZh ? '完成度' : 'Progress'}</p>
              <p className="text-sm font-black">{progress}%</p>
            </div>
          </div>
          <div className="mt-3 h-3 bg-white/10 brutal-border-thin rounded-full overflow-hidden p-[1px]">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {achievements.map((item) => (
          <div
            key={item.name}
            className={`p-4 rounded-2xl border ${item.unlocked ? 'bg-primary/95 text-bg-dark border-primary/45' : 'neo-card text-black border-black/8'} hover-lift`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${item.unlocked ? 'bg-bg-dark text-primary' : 'bg-black/10 text-black/60'}`}>
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
