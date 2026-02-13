import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DepositGoal, UserStats } from '../types';
import { AppLocale, formatPoints } from '../lib/format';
import { api } from '../lib/api';
import PointsTabs from '../components/PointsTabs';
import {
  calculatePointsFromProgress,
  POINTS_RULES,
  PointsProgress,
} from '../lib/points';

interface MissionsProps {
  stats: UserStats;
  goals: DepositGoal[];
  walletAddress: string | null;
  locale: AppLocale;
}

const scopeLabel = (scope: string, locale: AppLocale) => {
  if (scope === 'global') return locale === 'zh' ? '全局' : 'Global';
  if (scope === 'deposit') return locale === 'zh' ? '存款' : 'Deposit';
  if (scope === 'growth') return locale === 'zh' ? '增长' : 'Growth';
  return locale === 'zh' ? '治理' : 'Governance';
};

const Missions: React.FC<MissionsProps> = ({ stats, goals, walletAddress, locale }) => {
  const isZh = locale === 'zh';
  const activeGoals = goals.filter((goal) => !goal.claimed);

  const [purchaseCounts, setPurchaseCounts] = useState({ tier1: 0, tier2: 0, tier3: 0 });
  const [inviteCount, setInviteCount] = useState(0);
  const [missionProgress, setMissionProgress] = useState<Awaited<ReturnType<typeof api.getMissionProgress>> | null>(null);
  const [missionUnavailable, setMissionUnavailable] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!walletAddress) {
      setPurchaseCounts({ tier1: 0, tier2: 0, tier3: 0 });
      setInviteCount(0);
      setMissionProgress(null);
      setMissionUnavailable(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    Promise.allSettled([
      api.getPurchaseCounts(walletAddress),
      api.getClaimable(walletAddress),
      api.getMissionProgress(walletAddress),
    ])
      .then(([countRes, claimRes, missionRes]) => {
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
          setInviteCount(Number(claimRes.value?.inviteCount || 0));
        } else {
          setInviteCount(0);
        }
        if (missionRes.status === 'fulfilled') {
          setMissionProgress(missionRes.value);
          setMissionUnavailable(false);
        } else {
          setMissionProgress(null);
          setMissionUnavailable(true);
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
  const missionBackedRuleIds = useMemo(
    () => new Set(['signIn7', 'signIn21', 'governance', 'fixedStakeActive', 'fixedStakeMatured']),
    []
  );

  const progress = useMemo<PointsProgress>(
    () => {
      const remote = missionProgress?.progress;
      const signInDays = Number(remote?.signInDays || 0);
      return {
        walletConnect: Boolean(walletAddress),
        createGoal: goals.length > 0,
        firstPurchase: totalPurchases > 0,
        inviteOne: inviteCount >= 1 || Boolean(remote?.bindGroupDone),
        signIn7: Boolean(remote?.sign7Done) || signInDays >= 7,
        signIn21: Boolean(remote?.sign21Done) || signInDays >= 21,
        governance: Boolean(remote?.governanceDone),
        fixedStakeActive: Boolean(remote?.fixedStakeActive),
        fixedStakeMatured: Boolean(remote?.fixedStakeMatured),
      };
    },
    [walletAddress, goals.length, totalPurchases, inviteCount, missionProgress]
  );

  const unknownRuleIds = useMemo(() => {
    if (!walletAddress || !missionUnavailable) return new Set<string>();
    return new Set(Array.from(missionBackedRuleIds));
  }, [walletAddress, missionUnavailable, missionBackedRuleIds]);

  const ruleResult = useMemo(() => calculatePointsFromProgress(progress), [progress]);
  const shownPoints = Math.max(stats.points, ruleResult.totalPoints);
  const knownRuleCount = useMemo(
    () => POINTS_RULES.filter((rule) => !unknownRuleIds.has(rule.id)).length,
    [unknownRuleIds]
  );
  const doneCount = useMemo(
    () => POINTS_RULES.filter((rule) => !unknownRuleIds.has(rule.id) && ruleResult.completedIds.has(rule.id)).length,
    [unknownRuleIds, ruleResult.completedIds]
  );
  const completion = knownRuleCount > 0 ? Math.round((doneCount / knownRuleCount) * 100) : 0;

  return (
    <div className="page-view">
      <PointsTabs locale={locale} />
      <div className="hero-card p-6">
        <div>
          <p className="section-kicker">{isZh ? '任务进度' : 'Mission Progress'}</p>
          <div className="mt-1 grid grid-cols-[1fr_auto] items-end gap-3">
            <div>
              <p className="text-3xl font-black leading-none">{formatPoints(shownPoints, locale)}</p>
              <p className="text-[11px] font-bold text-white/60 mt-1">
                {isZh ? `任务完成 ${doneCount}/${knownRuleCount}` : `${doneCount}/${knownRuleCount} tasks completed`}
              </p>
            </div>
            <div className="imperial-deep px-3 py-2 rounded-xl text-right min-w-[102px]">
              <p className="text-[10px] font-black">{isZh ? '完成度' : 'Progress'}</p>
              <p className="text-sm font-black">{completion}%</p>
            </div>
          </div>

          <div className="mt-3 imperial-progress-track">
            <div className="imperial-progress-fill" style={{ width: `${completion}%` }} />
          </div>

          <p className="text-[10px] font-bold text-white/60 mt-2">
            {isZh
              ? `购买 ${totalPurchases} 次 · 有效邀请 ${inviteCount} 人`
              : `${totalPurchases} purchases · ${inviteCount} valid invites`}
          </p>
          {missionProgress && (
            <p className="text-[10px] font-bold text-white/55 mt-1">
              {isZh
                ? `连续签到 ${missionProgress.progress.signInDays} 天 · 任务系数 ${missionProgress.taskSaveRatioBp / 100}%`
                : `${missionProgress.progress.signInDays} check-in days · task ratio ${missionProgress.taskSaveRatioBp / 100}%`}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <div className="px-3 py-1.5 rounded-full imperial-deep text-white text-[10px] font-black whitespace-nowrap">
          {isZh ? '总任务' : 'All Tasks'} · {knownRuleCount}
        </div>
        <div className="px-3 py-1.5 rounded-full imperial-data text-[10px] font-black whitespace-nowrap">
          {isZh ? '已完成' : 'Done'} · {doneCount}
        </div>
        <div className="px-3 py-1.5 rounded-full imperial-data text-[10px] font-black whitespace-nowrap">
          {isZh ? '进行中' : 'In Progress'} · {Math.max(knownRuleCount - doneCount, 0)}
        </div>
        {unknownRuleIds.size > 0 && (
          <div className="px-3 py-1.5 rounded-full imperial-data text-[10px] font-black whitespace-nowrap">
            {isZh ? '待同步' : 'Pending Sync'} · {unknownRuleIds.size}
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        {POINTS_RULES.map((rule, idx) => {
          const unknown = unknownRuleIds.has(rule.id);
          const done = !unknown && ruleResult.completedIds.has(rule.id);
          return (
            <div key={rule.id} className="neo-card p-4 flex items-start justify-between gap-3 hover-lift">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-6 min-w-6 px-1 rounded-full text-[10px] font-black flex items-center justify-center ${
                      done ? 'bg-primary text-white' : 'imperial-data text-white/70'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <p className="font-black text-sm truncate">{isZh ? rule.titleZh : rule.titleEn}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full imperial-data font-black text-white/60">
                    {scopeLabel(rule.scope, locale)}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-white/60 mt-2 ml-8">{isZh ? rule.descZh : rule.descEn}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`imperial-chip ${done ? 'imperial-chip-primary' : 'imperial-chip-muted'}`}>
                  {unknown
                    ? (isZh ? '待同步' : 'Syncing')
                    : done
                      ? (isZh ? '已达成' : 'Done')
                      : (isZh ? '进行中' : 'In Progress')}
                </span>
                <span className="text-[10px] font-black text-white/45">+{rule.points} PTS</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Link to="/rewards" className="w-full tai-btn tai-btn-primary hover-lift">
          {isZh ? '查看积分中心' : 'Points Center'}
        </Link>
        <Link to="/unlocks" className="w-full tai-btn tai-btn-dark hover-lift">
          {isZh ? '查看解锁优先购' : 'Unlock Priority'}
        </Link>
      </div>

      {loading && (
        <div className="neo-card p-3 text-xs font-black text-white/60">
          {isZh ? '正在同步链上任务数据...' : 'Syncing on-chain mission data...'}
        </div>
      )}
      {missionUnavailable && walletAddress && (
        <div className="neo-card p-3 text-xs font-black text-white/60 border border-[#cfac56]/35">
          {isZh
            ? '部分任务状态暂不可用，已切换为保守展示（待同步）。'
            : 'Some mission states are temporarily unavailable and shown conservatively as pending sync.'}
        </div>
      )}
    </div>
  );
};

export default Missions;
