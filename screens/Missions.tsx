import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DepositGoal, UserStats } from '../types';
import { AppLocale, formatTai, toTaiNumber } from '../lib/format';
import { api } from '../lib/api';

interface MissionsProps {
  stats: UserStats;
  goals: DepositGoal[];
  walletAddress: string | null;
  locale: AppLocale;
}

interface MissionItem {
  id: string;
  name: string;
  description: string;
  done: boolean;
  impact: string;
}

const Missions: React.FC<MissionsProps> = ({ goals, walletAddress, locale }) => {
  const isZh = locale === 'zh';
  const activeGoals = goals.filter((goal) => !goal.claimed).length;
  const completedGoals = goals.filter((goal) => goal.claimed).length;

  const [purchaseCounts, setPurchaseCounts] = useState({ tier1: 0, tier2: 0, tier3: 0 });
  const [claimable, setClaimable] = useState<Awaited<ReturnType<typeof api.getClaimable>> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!walletAddress) {
      setPurchaseCounts({ tier1: 0, tier2: 0, tier3: 0 });
      setClaimable(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    Promise.allSettled([api.getPurchaseCounts(walletAddress), api.getClaimable(walletAddress)])
      .then(([countRes, claimRes]) => {
        if (cancelled) return;
        if (countRes.status === 'fulfilled') {
          setPurchaseCounts({
            tier1: Number(countRes.value?.counts?.tier1 || 0),
            tier2: Number(countRes.value?.counts?.tier2 || 0),
            tier3: Number(countRes.value?.counts?.tier3 || 0),
          });
        } else {
          setPurchaseCounts({ tier1: 0, tier2: 0, tier3: 0 });
        }
        if (claimRes.status === 'fulfilled') {
          setClaimable(claimRes.value);
        } else {
          setClaimable(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  const totalPurchases = purchaseCounts.tier1 + purchaseCounts.tier2 + purchaseCounts.tier3;
  const unlockedTai = toTaiNumber(claimable?.unlockedTai || 0);
  const pendingTai = toTaiNumber(claimable?.pendingTotalTai || 0);
  const taskSaveRatio = claimable?.ratios?.taskSaveRatioBp || 0;

  const missions = useMemo<MissionItem[]>(
    () => [
      {
        id: 'wallet',
        name: isZh ? '连接钱包' : 'Connect Wallet',
        description: isZh ? '完成身份绑定并启用链上交互。' : 'Bind identity and enable on-chain actions.',
        done: Boolean(walletAddress),
        impact: '+10%',
      },
      {
        id: 'deposit-goal',
        name: isZh ? '创建首个存款目标' : 'Create First Deposit Goal',
        description: isZh ? '每个地址最多 3 个目标，创建后不可改目标金额。' : 'Up to 3 goals per wallet; target is immutable after creation.',
        done: activeGoals > 0 || completedGoals > 0,
        impact: '+15%',
      },
      {
        id: 'purchase',
        name: isZh ? '完成首次购买' : 'Complete First Purchase',
        description: isZh ? '购买后自动写入任务系统并累计可领取奖励。' : 'Purchase auto-records tasks and accumulates claimable rewards.',
        done: totalPurchases > 0,
        impact: '+20%',
      },
      {
        id: 'invite',
        name: isZh ? '邀请 1 位完成购买' : 'Invite 1 Buyer',
        description: isZh ? '邀请会加速解锁，不再是唯一解锁路径。' : 'Invites accelerate unlocks, but are no longer the only path.',
        done: (claimable?.inviteCount || 0) >= 1,
        impact: '+10%',
      },
      {
        id: 'task-save',
        name: isZh ? '完成任务 + 存款路径' : 'Task + Save Path',
        description: isZh ? '不邀请也能通过任务与存 TAI 路径解锁到 100%。' : 'Unlock can reach 100% through missions and save goals without invites.',
        done: taskSaveRatio >= 10_000,
        impact: '+25%',
      },
      {
        id: 'claim',
        name: isZh ? '一次性链上领取' : 'One-Click On-chain Claim',
        description: isZh ? '链下记录 + 链上领取，用户自费 Gas。' : 'Recorded off-chain, claimed on-chain with user-paid gas.',
        done: unlockedTai > 0,
        impact: isZh ? '可领取' : 'Claimable',
      },
    ],
    [isZh, walletAddress, activeGoals, completedGoals, totalPurchases, claimable?.inviteCount, unlockedTai, taskSaveRatio]
  );

  const doneCount = missions.filter((item) => item.done).length;
  const completion = missions.length > 0 ? Math.round((doneCount / missions.length) * 100) : 0;

  return (
    <div className="page-view">
      <div className="neo-card-dark p-6 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-12 -right-10 h-44 w-44 rounded-full bg-primary/18 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-14 -left-8 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative z-10">
          <p className="section-kicker text-accent">{isZh ? '任务中心' : 'Mission Center'}</p>
          <div className="mt-1 grid grid-cols-[1fr_auto] items-end gap-3">
            <div>
              <p className="text-3xl font-black leading-none">{completion}%</p>
              <p className="text-[11px] font-bold text-white/70 mt-1">{isZh ? `已完成 ${doneCount}/${missions.length}` : `${doneCount}/${missions.length} completed`}</p>
            </div>
            <div className="bg-primary text-bg-dark brutal-border-thin px-3 py-2 rounded-xl text-right min-w-[92px]">
              <p className="text-[10px] font-black">{isZh ? '待领取' : 'Pending'}</p>
              <p className="text-sm font-black">{loading ? '...' : formatTai(pendingTai, locale)}</p>
            </div>
          </div>

          <div className="mt-3 h-3 bg-white/10 brutal-border-thin rounded-full overflow-hidden p-[1px]">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${completion}%` }} />
          </div>

          <p className="text-[10px] font-bold text-white/70 mt-2">
            {isZh
              ? `已购档位 ${totalPurchases} 次 · 邀请达成 ${claimable?.inviteCount ?? 0} 人 · 任务解锁 ${Math.floor(taskSaveRatio / 100)}%`
              : `${totalPurchases} purchases · ${claimable?.inviteCount ?? 0} invites · mission unlock ${Math.floor(taskSaveRatio / 100)}%`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <div className="px-3 py-1.5 rounded-full bg-bg-dark text-white text-[10px] font-black whitespace-nowrap">
          {isZh ? '总任务' : 'All Missions'} · {missions.length}
        </div>
        <div className="px-3 py-1.5 rounded-full bg-white brutal-border-thin text-[10px] font-black whitespace-nowrap">
          {isZh ? '已完成' : 'Done'} · {doneCount}
        </div>
        <div className="px-3 py-1.5 rounded-full bg-white brutal-border-thin text-[10px] font-black whitespace-nowrap">
          {isZh ? '进行中' : 'In Progress'} · {missions.length - doneCount}
        </div>
      </div>

      <div className="space-y-2.5">
        {missions.map((mission, idx) => (
          <div key={mission.id} className="neo-card p-4 flex items-start justify-between gap-3 hover-lift">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`h-6 min-w-6 px-1 rounded-full text-[10px] font-black flex items-center justify-center ${mission.done ? 'bg-primary text-bg-dark' : 'bg-black/10 text-black/70'}`}>
                  {idx + 1}
                </span>
                <p className="font-black text-sm truncate">{mission.name}</p>
              </div>
              <p className="text-[10px] font-bold opacity-70 mt-2 ml-8">{mission.description}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className={`px-2.5 py-1 text-[10px] font-black rounded-full ${mission.done ? 'bg-primary text-bg-dark' : 'bg-bg-dark text-white'}`}>
                {mission.done ? (isZh ? '已达成' : 'Done') : (isZh ? '进行中' : 'In Progress')}
              </span>
              <span className="text-[10px] font-black text-black/45">{mission.impact}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Link to="/deposit" className="w-full tai-btn tai-btn-primary hover-lift">
          {isZh ? '去存款目标' : 'Go Deposit'}
        </Link>
        <Link to="/rewards" className="w-full tai-btn tai-btn-dark hover-lift">
          {isZh ? '去领取奖励' : 'Claim Rewards'}
        </Link>
      </div>
    </div>
  );
};

export default Missions;
