import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLocale, formatPoints, formatTai, formatUsd } from '../lib/format';
import { computePriorityQuota, DEFAULT_UNLOCK_ROUNDS, getRoundLabel, getTimeRemaining, POINTS_TO_PRIORITY_TAI } from '../lib/points';
import PointsTabs from '../components/PointsTabs';

interface UnlocksProps {
  walletAddress: string | null;
  locale: AppLocale;
  points: number;
}

const Unlocks: React.FC<UnlocksProps> = ({ walletAddress, locale, points }) => {
  const isZh = locale === 'zh';
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const rounds = useMemo(
    () =>
      [...DEFAULT_UNLOCK_ROUNDS].sort(
        (a, b) => new Date(a.unlockAt).getTime() - new Date(b.unlockAt).getTime()
      ),
    []
  );

  const currentRound = useMemo(() => {
    const upcoming = rounds.find((round) => new Date(round.unlockAt).getTime() >= nowMs);
    return upcoming || rounds[rounds.length - 1];
  }, [rounds, nowMs]);

  const unlockAtMs = new Date(currentRound.unlockAt).getTime();
  const remaining = getTimeRemaining(unlockAtMs, nowMs);
  const quota = computePriorityQuota(points, currentRound.priorityTaiCapPerUser);
  const estimatedCost = quota.quotaTai * currentRound.priceUsdtPerTai;
  const isOpen = unlockAtMs <= nowMs;

  return (
    <div className="page-view">
      <PointsTabs locale={locale} />
      <div className="hero-card p-6">
        <div>
          <p className="section-kicker">{isZh ? '优先购买窗口' : 'Priority Buy Window'}</p>
          <h2 className="text-3xl font-black tracking-tight mt-1">
            {getRoundLabel(currentRound, locale)}
          </h2>
          <p className="text-xs font-bold text-white/60 mt-2">
            {isZh ? '积分决定你在下一轮的优先额度。' : 'Points determine your next-round priority quota.'}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="imperial-data rounded-xl px-2.5 py-2">
              <p className="text-[9px] font-bold text-white/60">{isZh ? '当前积分' : 'Points'}</p>
              <p className="text-sm font-black">{formatPoints(points, locale)}</p>
            </div>
            <div className="imperial-data rounded-xl px-2.5 py-2">
              <p className="text-[9px] font-bold text-white/60">{isZh ? '本轮价格' : 'Round Price'}</p>
              <p className="text-sm font-black">{formatUsd(currentRound.priceUsdtPerTai, locale, 6)} / TAI</p>
            </div>
            <div className="imperial-deep rounded-xl px-2.5 py-2">
              <p className="text-[9px] font-bold">{isZh ? '优先额度' : 'Priority Quota'}</p>
              <p className="text-sm font-black">{formatTai(quota.quotaTai, locale)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="neo-card p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="section-kicker">{isZh ? '窗口状态' : 'Window Status'}</p>
          <span className={`imperial-chip ${isOpen ? 'imperial-chip-primary' : 'imperial-chip-muted'}`}>
            {isOpen ? (isZh ? '已解锁' : 'Open') : (isZh ? '未解锁' : 'Upcoming')}
          </span>
        </div>
        {!isOpen && (
          <p className="text-sm font-black mt-2">
            {isZh
              ? `距离解锁：${remaining.days}天 ${remaining.hours}小时 ${remaining.minutes}分`
              : `Unlock in ${remaining.days}d ${remaining.hours}h ${remaining.minutes}m`}
          </p>
        )}
        {isOpen && (
          <p className="text-sm font-black mt-2">
            {isZh ? '本轮已解锁，可按本轮价格执行优先购买。' : 'Round is open for priority buying at current unlock price.'}
          </p>
        )}
      </div>

      <div className="neo-card p-4">
        <p className="section-kicker">{isZh ? '额度计算' : 'Quota Formula'}</p>
        <div className="mt-2 space-y-1 text-xs font-black text-white/75">
          <p>{isZh ? `1 TAI 优先额度 = ${POINTS_TO_PRIORITY_TAI} 积分` : `1 TAI priority quota = ${POINTS_TO_PRIORITY_TAI} points`}</p>
          <p>{isZh ? `等级加成后积分：${formatPoints(quota.boostedPoints, locale)}` : `Points after level boost: ${formatPoints(quota.boostedPoints, locale)}`}</p>
          <p>{isZh ? `本轮个人上限：${formatTai(currentRound.priorityTaiCapPerUser, locale)}` : `Per-user cap this round: ${formatTai(currentRound.priorityTaiCapPerUser, locale)}`}</p>
          <p>{isZh ? `预计可买：${formatTai(quota.quotaTai, locale)}` : `Estimated purchasable: ${formatTai(quota.quotaTai, locale)}`}</p>
          <p>{isZh ? `按本轮价格预计成本：${formatUsd(estimatedCost, locale, 2)}` : `Estimated cost at round price: ${formatUsd(estimatedCost, locale, 2)}`}</p>
        </div>
      </div>

      <div className="neo-card p-4">
        <p className="section-kicker">{isZh ? '后续轮次' : 'Upcoming Rounds'}</p>
        <div className="mt-2 space-y-2">
          {rounds.map((round) => {
            const roundTime = new Date(round.unlockAt).getTime();
            const done = roundTime < nowMs;
            return (
              <div key={round.id} className="imperial-data rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-black">{getRoundLabel(round, locale)}</p>
                  <p className="text-[10px] font-bold text-white/60">
                    {new Date(round.unlockAt).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black">{formatUsd(round.priceUsdtPerTai, locale, 6)} / TAI</p>
                  <p className="text-[10px] font-bold text-white/60">
                    {done ? (isZh ? '已解锁' : 'Unlocked') : (isZh ? '待解锁' : 'Locked')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!walletAddress && (
        <div className="neo-card p-4 border border-neon-orange/35">
          <p className="text-[11px] font-black text-white/75">
            {isZh ? '连接钱包后可同步积分并计算你在下一轮的优先额度。' : 'Connect wallet to sync points and compute your next-round priority quota.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <Link to="/missions" className="w-full tai-btn tai-btn-soft hover-lift">
          {isZh ? '去做任务赚积分' : 'Do Missions'}
        </Link>
        <Link to="/rewards" className="w-full tai-btn tai-btn-primary hover-lift">
          {isZh ? '查看积分中心' : 'Open Points Center'}
        </Link>
      </div>
    </div>
  );
};

export default Unlocks;
