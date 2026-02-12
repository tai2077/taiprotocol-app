import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppLocale, formatPoints } from '../lib/format';
import { getPointsLabel, POINTS_LEVELS, POINTS_RULES, POINTS_SYSTEM_VERSION, resolvePointsLevel } from '../lib/points';
import PointsTabs from '../components/PointsTabs';

interface RewardsProps {
  walletAddress: string | null;
  locale: AppLocale;
  points: number;
}

const Rewards: React.FC<RewardsProps> = ({ walletAddress, locale, points }) => {
  const isZh = locale === 'zh';
  const level = resolvePointsLevel(points);
  const progressToNextLevel = useMemo(() => {
    const currentIdx = POINTS_LEVELS.findIndex((item) => item.id === level.id);
    const next = currentIdx >= 0 ? POINTS_LEVELS[currentIdx + 1] : undefined;
    if (!next) {
      return {
        ratio: 100,
        label: isZh ? '已达到最高积分等级' : 'Top points tier reached',
      };
    }
    const currentMin = level.minPoints;
    const span = Math.max(1, next.minPoints - currentMin);
    const ratio = Math.max(0, Math.min(100, Math.round(((points - currentMin) / span) * 100)));
    const remain = Math.max(0, next.minPoints - points);
    return {
      ratio,
      label: isZh ? `距离 ${next.titleZh} 还差 ${remain.toLocaleString('zh-CN')} PTS` : `${remain.toLocaleString('en-US')} PTS to ${next.titleEn}`,
    };
  }, [isZh, level.id, level.minPoints, points]);

  return (
    <div className="page-view">
      <PointsTabs locale={locale} />
      <div className="hero-card p-6">
        <div>
          <p className="section-kicker">{isZh ? '全局积分账户' : 'Global Points Account'}</p>
          <p className="text-3xl font-black number-display">{formatPoints(points, locale)}</p>
          <p className="text-[11px] font-bold text-white/60 mt-1">{isZh ? `系统版本 ${POINTS_SYSTEM_VERSION}` : `System ${POINTS_SYSTEM_VERSION}`}</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="imperial-data rounded-xl px-2.5 py-2">
              <p className="text-[9px] font-bold text-white/60">{isZh ? '当前等级' : 'Current Tier'}</p>
              <p className="text-sm font-black">{getPointsLabel(level, locale)}</p>
            </div>
            <div className="imperial-data rounded-xl px-2.5 py-2">
              <p className="text-[9px] font-bold text-white/60">{isZh ? '优先系数' : 'Priority Boost'}</p>
              <p className="text-sm font-black number-display">{(level.priorityBoostBp / 10000).toFixed(2)}x</p>
            </div>
            <div className="imperial-deep rounded-xl px-2.5 py-2">
              <p className="text-[9px] font-bold">{isZh ? '账户状态' : 'Account'}</p>
              <p className="text-sm font-black">{walletAddress ? (isZh ? '已激活' : 'Active') : (isZh ? '未连接' : 'Guest')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="neo-card p-4">
        <div className="flex items-center justify-between text-xs font-black">
          <p>{isZh ? '等级进度' : 'Tier Progress'}</p>
          <p>{progressToNextLevel.ratio}%</p>
        </div>
        <div className="mt-2 imperial-progress-track">
          <div className="imperial-progress-fill" style={{ width: `${progressToNextLevel.ratio}%` }} />
        </div>
        <p className="text-[10px] font-bold text-white/65 mt-2">{progressToNextLevel.label}</p>
      </div>

      <div className="neo-card p-4">
        <p className="section-kicker">{isZh ? '核心用途' : 'Core Uses'}</p>
        <div className="mt-2 space-y-1 text-xs font-black text-white/75">
          <p>{isZh ? '1) 下一轮解锁优先购买权（按当轮价格）' : '1) Priority buy quota for next unlock round (at round price)'}</p>
          <p>{isZh ? '2) 跨应用身份等级与权益系数' : '2) Cross-app identity tier and privilege multiplier'}</p>
        </div>
      </div>

      <div className="neo-card p-4">
        <p className="section-kicker">{isZh ? '任务积分矩阵' : 'Mission Points Matrix'}</p>
        <div className="mt-2 space-y-2">
          {POINTS_RULES.map((rule) => (
            <div key={rule.id} className="imperial-data rounded-xl px-3 py-2 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-black">{isZh ? rule.titleZh : rule.titleEn}</p>
                <p className="text-[10px] font-bold text-white/60">{isZh ? rule.descZh : rule.descEn}</p>
              </div>
              <span className="text-[11px] font-black text-accent">+{rule.points} PTS</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Link to="/missions" className="w-full tai-btn tai-btn-soft hover-lift">
          {isZh ? '去做任务' : 'Open Missions'}
        </Link>
        <Link to="/unlocks" className="w-full tai-btn tai-btn-primary hover-lift">
          {isZh ? '查看解锁优先购' : 'View Priority Unlock'}
        </Link>
      </div>

      {!walletAddress && (
        <div className="neo-card p-4 border border-neon-orange/35">
          <p className="text-[11px] font-black text-white/75">
            {isZh ? '连接钱包后将同步你的积分等级、任务进度和优先购买额度。' : 'Connect wallet to sync your points tier, mission progress, and priority buy quota.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Rewards;
