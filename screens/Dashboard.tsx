import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DepositGoal, UserStats } from '../types';
import { api } from '../lib/api';
import { formatTai, formatUsd, formatUsdPerTai } from '../lib/format';

interface DashboardProps {
  stats: UserStats;
  goals: DepositGoal[];
  walletAddress: string | null;
  locale: 'zh' | 'en';
}

const Dashboard: React.FC<DashboardProps> = ({ stats, goals, walletAddress, locale }) => {
  const [taiPriceUsd, setTaiPriceUsd] = useState(0.00008);

  useEffect(() => {
    let mounted = true;
    let timer = 0;

    const fetchPrice = () => {
      api
        .getPrice()
        .then((data) => {
          const nextPrice = Number(data?.price);
          if (!mounted || !Number.isFinite(nextPrice) || nextPrice <= 0) return;
          setTaiPriceUsd(nextPrice);
        })
        .catch(() => {});
    };

    fetchPrice();
    timer = window.setInterval(fetchPrice, 20000);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const primaryGoalTai = Math.max(1, Math.round(stats.wealthGoalUsd / Math.max(taiPriceUsd, 0.000000001)));
  const progress = Math.min(100, Math.round((stats.onchainTai / primaryGoalTai) * 100));
  const activeGoals = goals.filter((goal) => !goal.claimed);
  const achievedGoals = goals.filter((goal) => goal.claimed).length;
  const totalGoalUsd = activeGoals.reduce((sum, goal) => sum + goal.targetUsd, 0);
  const currentGoalUsd = activeGoals.reduce((sum, goal) => sum + goal.depositedTai * taiPriceUsd, 0);
  const trainingTasks = [
    { label: locale === 'zh' ? '连接钱包' : 'Connect Wallet', done: Boolean(walletAddress) },
    { label: locale === 'zh' ? '创建 1 个存款目标' : 'Create 1 deposit goal', done: activeGoals.length > 0 || achievedGoals > 0 },
    { label: locale === 'zh' ? '完成 1 次购买补给' : 'Complete 1 purchase', done: stats.pendingTai > 0 || stats.onchainTai > 0 },
  ];
  const missionDoneCount = trainingTasks.filter((item) => item.done).length;
  const portfolioProgress = activeGoals.length > 0
    ? Math.min(100, Math.round((currentGoalUsd / Math.max(totalGoalUsd, 1)) * 100))
    : 0;
  const circleRadius = 54;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const circleOffset = circleCircumference * (1 - progress / 100);

  return (
    <div className="flex-1 flex flex-col grid-background safe-content-bottom p-4 gap-4 animate-in fade-in duration-300">
      <div className="neo-card-dark p-5 scanline relative overflow-hidden">
        <div className="pointer-events-none absolute -top-14 -right-12 h-44 w-44 rounded-full bg-primary/16 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-accent/20 blur-3xl" />
        <div className="flex items-start justify-between gap-3">
          <div className="relative z-10">
            <p className="section-kicker text-accent">{locale === 'zh' ? '存款训练营' : 'Deposit Camp'}</p>
            <p className="text-xl font-black tracking-tight">{locale === 'zh' ? '通往财富自由之路' : 'Road to Financial Freedom'}</p>
            <p className="text-xs font-bold text-white/70 mt-1">{locale === 'zh' ? '目标净值' : 'Target Net Worth'} · {formatUsd(stats.wealthGoalUsd, locale)}</p>
          </div>
          <div className="bg-primary text-black brutal-border-thin px-3 py-2 rounded-xl min-w-[98px] text-right relative z-10">
            <p className="text-[10px] font-black">{locale === 'zh' ? '待领取' : 'Pending'}</p>
            <p className="text-base font-black">{formatTai(stats.pendingTai, locale)}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-[130px_1fr] gap-4 items-center relative z-10">
          <div className="relative mx-auto">
            <svg className="w-[118px] h-[118px] -rotate-90">
              <circle cx="59" cy="59" r={circleRadius} className="fill-none stroke-white/12" strokeWidth="8" />
              <circle
                cx="59"
                cy="59"
                r={circleRadius}
                className="fill-none stroke-primary"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circleCircumference}
                strokeDashoffset={circleOffset}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-black leading-none">{progress}%</p>
              <p className="text-[9px] section-kicker text-white/70">{locale === 'zh' ? '已解锁' : 'Unlocked'}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-white/8 brutal-border-thin rounded-xl px-3 py-2">
              <p className="text-[10px] font-bold text-white/65">{locale === 'zh' ? '链上估值' : 'On-chain Value'}</p>
              <p className="text-sm font-black">{formatUsd(stats.onchainTai * taiPriceUsd, locale, 2)}</p>
            </div>
            <div className="bg-white/8 brutal-border-thin rounded-xl px-3 py-2">
              <p className="text-[10px] font-bold text-white/65">{locale === 'zh' ? '当前价格' : 'Current Price'}</p>
              <p className="text-sm font-black">{formatUsdPerTai(taiPriceUsd, locale)}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 relative z-10">
          <div className="h-3 bg-white/10 brutal-border-thin rounded-full overflow-hidden">
            <div className="h-full bg-accent transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 relative z-10">
          <div className="bg-white/8 brutal-border-thin rounded-xl px-2.5 py-2">
            <p className="text-[9px] font-bold text-white/60">{locale === 'zh' ? '排名' : 'Rank'}</p>
            <p className="text-sm font-black">#{stats.rank ?? '-'}</p>
          </div>
          <div className="bg-white/8 brutal-border-thin rounded-xl px-2.5 py-2">
            <p className="text-[9px] font-bold text-white/60">{locale === 'zh' ? '活跃目标' : 'Active Goals'}</p>
            <p className="text-sm font-black">{activeGoals.length}</p>
          </div>
          <div className="bg-white/8 brutal-border-thin rounded-xl px-2.5 py-2">
            <p className="text-[9px] font-bold text-white/60">{locale === 'zh' ? '已达标' : 'Reached'}</p>
            <p className="text-sm font-black">{achievedGoals}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="neo-card p-4 hover-lift">
          <p className="section-kicker">{locale === 'zh' ? '可用 TAI' : 'Available TAI'}</p>
          <p className="text-lg font-black italic">{formatTai(stats.taiBalance, locale)}</p>
        </div>
        <div className="neo-card p-4 hover-lift text-center">
          <p className="section-kicker">{locale === 'zh' ? '锁定 TAI' : 'Locked TAI'}</p>
          <p className="text-lg font-black italic">{formatTai(stats.lockedTai, locale)}</p>
        </div>
      </div>

      <div className="neo-card p-3.5 flex items-center justify-between">
        <p className="section-kicker">{locale === 'zh' ? '钱包 TON 余额' : 'Wallet TON Balance'}</p>
        <p className="text-sm font-black">{stats.tonBalance.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', { maximumFractionDigits: 4 })} TON</p>
      </div>

      <div className="neo-card p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="section-kicker">{locale === 'zh' ? '今日任务' : 'Today Missions'} · {missionDoneCount}/{trainingTasks.length}</p>
          <Link to="/missions" className="text-[10px] font-black underline underline-offset-2">
            {locale === 'zh' ? '查看全部' : 'View All'}
          </Link>
        </div>
        <div className="mt-3 space-y-2.5">
          {trainingTasks.map((task) => (
            <div key={task.label} className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 brutal-border-thin ${task.done ? 'bg-primary/10 border-primary/30' : 'bg-black/5'}`}>
              <p className="text-[11px] font-black">{task.label}</p>
              <span className={`text-[10px] px-2 py-1 rounded-lg brutal-border-thin font-black ${task.done ? 'bg-primary text-black' : 'bg-white text-black'}`}>
                {task.done ? (locale === 'zh' ? '已完成' : 'Done') : locale === 'zh' ? '进行中' : 'In Progress'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="neo-card p-4">
        <p className="section-kicker">{locale === 'zh' ? '快捷操作' : 'Quick Actions'}</p>
        <div className="grid grid-cols-2 gap-2.5 mt-3">
          <Link to="/deposit" className="w-full tai-btn tai-btn-primary hover-lift">
            {locale === 'zh' ? '创建/补存目标' : 'Create / Top-up Goal'}
          </Link>
          <Link to="/sale" className="w-full tai-btn tai-btn-warn hover-lift">
            {locale === 'zh' ? '低门槛补给' : 'Buy TAI'}
          </Link>
          <Link to="/invite" className="col-span-2 w-full tai-btn tai-btn-dark hover-lift">
            {locale === 'zh' ? '邀请小队（提升解锁）' : 'Invite Team (Boost Unlock)'}
          </Link>
          <Link to="/leaderboard" className="w-full tai-btn tai-btn-soft hover-lift">
            {locale === 'zh' ? '冲刺榜单' : 'Leaderboard'}
          </Link>
          <Link to="/achievements" className="w-full tai-btn tai-btn-soft hover-lift">
            {locale === 'zh' ? '查看成就' : 'Achievements'}
          </Link>
        </div>
      </div>

      <div className="neo-card-dark p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="section-kicker text-accent">{locale === 'zh' ? '存款总览' : 'Deposit Overview'}</p>
          <p className="text-[10px] font-black text-white/70">{locale === 'zh' ? '已达标' : 'Reached'} {achievedGoals}</p>
        </div>
        {activeGoals.length === 0 && <p className="text-xs font-bold text-white/70 mt-2">{locale === 'zh' ? `还没有创建存款目标，先开第一个 ${formatUsd(100000, locale)} 目标。` : `No deposit goal yet. Start with your first ${formatUsd(100000, locale)} goal.`}</p>}
        {activeGoals.length > 0 && (
          <div className="mt-2">
            <p className="text-[10px] font-bold text-white/70">
              {locale === 'zh' ? '全部目标估值' : 'All Goals Value'}：{formatUsd(currentGoalUsd, locale, 2)} / {formatUsd(totalGoalUsd, locale)}
            </p>
            <div className="h-3 bg-white/10 brutal-border-thin rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${portfolioProgress}%` }}
              ></div>
            </div>
            <p className="text-[10px] font-bold text-primary mt-1">{portfolioProgress}%</p>
          </div>
        )}
      </div>

      <div className="neo-card p-4">
        <p className="section-kicker">{locale === 'zh' ? '钱包地址' : 'Wallet Address'}</p>
        <p className="text-xs font-black mt-1 break-all text-black/75">{walletAddress || (locale === 'zh' ? '未连接钱包' : 'Wallet not connected')}</p>
      </div>
    </div>
  );
};

export default Dashboard;
