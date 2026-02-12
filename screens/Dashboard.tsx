import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DepositGoal, UserStats } from '../types';
import { api } from '../lib/api';
import { formatPoints, formatTai, formatUsd, formatUsdPerTai } from '../lib/format';
import { computePriorityQuota, DEFAULT_UNLOCK_ROUNDS, getPointsLabel, getRoundLabel } from '../lib/points';

interface DashboardProps {
  stats: UserStats;
  goals: DepositGoal[];
  walletAddress: string | null;
  locale: 'zh' | 'en';
}

const DoneTaskIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="7" stroke="#cfac56" strokeWidth="1.5" />
    <path d="M5 8l2 2 4-4" stroke="#cfac56" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PendingTaskIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="7" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeDasharray="2 2" />
  </svg>
);

const TargetIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <circle cx="8" cy="8" r="6" />
    <circle cx="8" cy="8" r="2.5" />
    <path d="M8 2v2M8 12v2M2 8h2M12 8h2" />
  </svg>
);

const BagIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M4 5h8l1 9H3L4 5z" />
    <path d="M6 5V4a2 2 0 0 1 4 0v1" />
  </svg>
);

const UsersIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <circle cx="6" cy="5" r="2" />
    <circle cx="11" cy="5" r="1.5" />
    <path d="M2 14c.8-2.5 2.5-3.5 4-3.5s3.2 1 4 3.5" />
    <path d="M10 14c.5-1.5 1.5-2.2 2.5-2.2" />
  </svg>
);

const LockIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <rect x="3" y="7" width="10" height="7" rx="1.5" />
    <path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" />
  </svg>
);

const UnlockIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <rect x="3" y="7" width="10" height="7" rx="1.5" />
    <path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0" />
  </svg>
);

const StarIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M8 2l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9L4.4 13l.7-4-2.9-2.8 4-.6L8 2z" />
  </svg>
);

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
  const rounds = [...DEFAULT_UNLOCK_ROUNDS].sort(
    (a, b) => new Date(a.unlockAt).getTime() - new Date(b.unlockAt).getTime()
  );
  const nowMs = Date.now();
  const currentRound = rounds.find((round) => new Date(round.unlockAt).getTime() >= nowMs) || rounds[rounds.length - 1];
  const priorityQuota = computePriorityQuota(stats.points, currentRound.priorityTaiCapPerUser);

  const trainingTasks = [
    { label: locale === 'zh' ? '连接钱包' : 'Connect Wallet', done: Boolean(walletAddress) },
    { label: locale === 'zh' ? '创建 1 个存款目标' : 'Create 1 deposit goal', done: activeGoals.length > 0 || achievedGoals > 0 },
    { label: locale === 'zh' ? '完成 1 次购买补给' : 'Complete 1 purchase', done: stats.onchainTai > 0 || stats.points > 0 },
    { label: locale === 'zh' ? '查看解锁页并确认额度' : 'Check unlock quota', done: stats.points > 0 },
  ];
  const missionDoneCount = trainingTasks.filter((item) => item.done).length;
  const portfolioProgress = activeGoals.length > 0
    ? Math.min(100, Math.round((currentGoalUsd / Math.max(totalGoalUsd, 1)) * 100))
    : 0;
  const ringRadius = 31;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const heroNumberStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, #ffe4a0 0%, #f6df9a 28%, #cfac56 70%, #a68b3d 100%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  };

  return (
    <div className="page-view">
      <div className="hero-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="section-kicker">{locale === 'zh' ? '存款训练营' : 'Deposit Camp'}</p>
            <p className="text-[11px] font-bold text-white/60 mt-2">{locale === 'zh' ? '目标净值' : 'Target Net Worth'}</p>
            <p className="text-[2.05rem] sm:text-[2.45rem] font-black tracking-tight leading-none number-display mt-1" style={heroNumberStyle}>
              {formatUsd(stats.wealthGoalUsd, locale)}
            </p>
            <p className="text-[11px] font-bold text-white/60 mt-2">{locale === 'zh' ? '实时进度与积分' : 'Live progress & points'}</p>
          </div>
          <div className="data-block min-w-[132px] text-center px-3 py-3">
            <div className="relative mx-auto w-[84px] h-[84px]">
              <svg
                className="w-[84px] h-[84px] -rotate-90"
                viewBox="0 0 84 84"
                style={{ filter: 'drop-shadow(0 0 7px rgba(207,172,86,0.35))' }}
              >
                <defs>
                  <linearGradient id="dashboard-ring-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f6df9a" />
                    <stop offset="55%" stopColor="#cfac56" />
                    <stop offset="100%" stopColor="#c8102e" />
                  </linearGradient>
                </defs>
                <circle cx="42" cy="42" r={ringRadius} className="fill-none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                <circle
                  cx="42"
                  cy="42"
                  r={ringRadius}
                  className="fill-none"
                  stroke="url(#dashboard-ring-gradient)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringCircumference * (1 - progress / 100)}
                  style={{ transition: 'stroke-dashoffset 0.4s ease-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-lg font-black leading-none number-display">
                  <span>{progress}</span>
                  <span className="text-[11px] align-top ml-[1px]">%</span>
                </p>
                <p className="text-[9px] text-white/60">{locale === 'zh' ? '进度' : 'Progress'}</p>
              </div>
            </div>
            <p className="text-[10px] font-bold text-white/60 mt-2">{locale === 'zh' ? '当前积分' : 'Points'}</p>
            <p className="text-sm font-black number-display">{formatPoints(stats.points, locale)}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          <div className="data-block">
            <p className="text-[10px] font-bold text-white/60">{locale === 'zh' ? '链上估值' : 'On-chain Value'}</p>
            <p className="text-sm font-black number-display">{formatUsd(stats.onchainTai * taiPriceUsd, locale, 2)}</p>
          </div>
          <div className="data-block">
            <p className="text-[10px] font-bold text-white/60">{locale === 'zh' ? '当前价格' : 'Current Price'}</p>
            <p className="text-sm font-black number-display">{formatUsdPerTai(taiPriceUsd, locale)}</p>
          </div>
          <div className="data-block">
            <p className="text-[10px] font-bold text-white/60">{locale === 'zh' ? '下一轮优先额' : 'Next Quota'}</p>
            <p className="text-sm font-black number-display">{formatTai(priorityQuota.quotaTai, locale)}</p>
          </div>
          <div className="data-block">
            <p className="text-[9px] font-bold text-white/60">{locale === 'zh' ? '积分等级' : 'Points Tier'}</p>
            <p className="text-sm font-black">{getPointsLabel(priorityQuota.level, locale)}</p>
          </div>
          <div className="data-block">
            <p className="text-[9px] font-bold text-white/60">{locale === 'zh' ? '活跃目标' : 'Active Goals'}</p>
            <p className="text-sm font-black number-display">{activeGoals.length}</p>
          </div>
          <div className="data-block">
            <p className="text-[9px] font-bold text-white/60">{locale === 'zh' ? '已达标' : 'Reached'}</p>
            <p className="text-sm font-black number-display">{achievedGoals}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="neo-card p-4 hover-lift">
          <p className="section-kicker">{locale === 'zh' ? '可用 TAI' : 'Available TAI'}</p>
          <p className="text-lg font-black number-display">{formatTai(stats.taiBalance, locale)}</p>
        </div>
        <div className="neo-card p-4 hover-lift text-center">
          <p className="section-kicker">{locale === 'zh' ? '锁定 TAI' : 'Locked TAI'}</p>
          <p className="text-lg font-black number-display">{formatTai(stats.lockedTai, locale)}</p>
        </div>
      </div>

      <div className="neo-card p-3.5 flex items-center justify-between">
        <p className="section-kicker">{locale === 'zh' ? '钱包 TON 余额' : 'Wallet TON Balance'}</p>
        <p className="text-sm font-black number-display">{stats.tonBalance.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', { maximumFractionDigits: 4 })} TON</p>
      </div>

      <div className="neo-card p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="section-kicker">{locale === 'zh' ? '解锁优先购' : 'Unlock Priority Buy'}</p>
          <p className="text-[10px] font-black text-white/60">{getRoundLabel(currentRound, locale)}</p>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="data-block">
            <p className="text-[10px] font-bold text-white/60">{locale === 'zh' ? '可优先购买' : 'Priority Quota'}</p>
            <p className="text-sm font-black number-display">{formatTai(priorityQuota.quotaTai, locale)}</p>
          </div>
          <div className="data-block">
            <p className="text-[10px] font-bold text-white/60">{locale === 'zh' ? '本轮价格' : 'Round Price'}</p>
            <p className="text-sm font-black number-display">{formatUsd(currentRound.priceUsdtPerTai, locale, 6)} / TAI</p>
          </div>
        </div>
      </div>

      <div className="neo-card p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="section-kicker">{locale === 'zh' ? '今日任务' : 'Today Missions'} · {missionDoneCount}/{trainingTasks.length}</p>
          <Link to="/missions" className="text-[10px] font-black underline underline-offset-2">
            {locale === 'zh' ? '查看全部' : 'View All'}
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {trainingTasks.map((task) => (
            <div key={task.label} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${task.done ? 'status-done' : 'status-pending'}`}>
              {task.done ? <DoneTaskIcon /> : <PendingTaskIcon />}
              <p className="text-[11px] font-black">{task.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="neo-card p-5">
        <p className="section-kicker">{locale === 'zh' ? '快捷操作' : 'Quick Actions'}</p>
        <div className="grid grid-cols-2 gap-2.5 mt-3">
          <Link to="/deposit" className="w-full tai-btn tai-btn-primary hover-lift flex items-center justify-center gap-1.5">
            <TargetIcon />
            {locale === 'zh' ? '创建目标' : 'Create Goal'}
          </Link>
          <Link to="/sale" className="w-full tai-btn tai-btn-warn hover-lift flex items-center justify-center gap-1.5">
            <BagIcon />
            {locale === 'zh' ? '立即补给' : 'Buy Now'}
          </Link>
          <Link to="/invite" className="col-span-2 w-full tai-btn tai-btn-dark hover-lift flex items-center justify-center gap-1.5">
            <UsersIcon />
            {locale === 'zh' ? '邀请小队' : 'Invite Team'}
          </Link>
          <Link to="/stake" className="w-full tai-btn tai-btn-soft hover-lift flex items-center justify-center gap-1.5">
            <LockIcon />
            {locale === 'zh' ? '固定质押' : 'Fixed Stake'}
          </Link>
          <Link to="/unlocks" className="w-full tai-btn tai-btn-soft hover-lift flex items-center justify-center gap-1.5">
            <UnlockIcon />
            {locale === 'zh' ? '解锁额度' : 'Unlock Quota'}
          </Link>
          <Link to="/rewards" className="w-full tai-btn tai-btn-soft hover-lift flex items-center justify-center gap-1.5">
            <StarIcon />
            {locale === 'zh' ? '积分' : 'Points'}
          </Link>
        </div>
      </div>

      <div className="neo-card p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="section-kicker">{locale === 'zh' ? '存款总览' : 'Deposit Overview'}</p>
          <p className="text-[10px] font-black text-white/60">{locale === 'zh' ? '已达标' : 'Reached'} {achievedGoals}</p>
        </div>
        {activeGoals.length === 0 && <p className="text-xs font-bold text-white/60 mt-2">{locale === 'zh' ? `还没有创建存款目标，先开第一个 ${formatUsd(100000, locale)} 目标。` : `No deposit goal yet. Start with your first ${formatUsd(100000, locale)} goal.`}</p>}
        {activeGoals.length > 0 && (
          <div className="mt-2">
            <p className="text-[10px] font-bold text-white/60">
              {locale === 'zh' ? '全部目标估值' : 'All Goals Value'}：{formatUsd(currentGoalUsd, locale, 2)} / {formatUsd(totalGoalUsd, locale)}
            </p>
            <div className="imperial-progress-track mt-2">
              <div
                className="imperial-progress-fill"
                style={{ width: `${portfolioProgress}%` }}
              ></div>
            </div>
            <p className="text-[10px] font-bold text-accent mt-1 number-display">{portfolioProgress}%</p>
          </div>
        )}
      </div>

      <div className="neo-card p-4">
        <p className="section-kicker">{locale === 'zh' ? '钱包地址' : 'Wallet Address'}</p>
        <p className="text-xs font-black mt-1 break-all text-white/75">{walletAddress || (locale === 'zh' ? '未连接钱包' : 'Wallet not connected')}</p>
      </div>
    </div>
  );
};

export default Dashboard;
