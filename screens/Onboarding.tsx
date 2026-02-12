import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserStats } from '../types';
import { api } from '../lib/api';
import { AppLocale, formatUsd, formatUsdPerTai } from '../lib/format';

interface OnboardingProps {
  stats: UserStats;
  onSetGoal: (goalUsd: number) => void;
  locale: AppLocale;
}

const Onboarding: React.FC<OnboardingProps> = ({ stats, onSetGoal, locale }) => {
  const navigate = useNavigate();
  const [goal, setGoal] = useState(stats.wealthGoalUsd);
  const [taiPriceUsd, setTaiPriceUsd] = useState(0.00008);
  const [priceLoading, setPriceLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setPriceLoading(true);
    api
      .getPrice()
      .then((data) => {
        const nextPrice = Number(data?.price);
        if (!mounted || !Number.isFinite(nextPrice) || nextPrice <= 0) return;
        setTaiPriceUsd(nextPrice);
      })
      .catch(() => {
        // keep default estimate when oracle is unavailable
      })
      .finally(() => {
        if (mounted) setPriceLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const needTai = useMemo(() => Math.round(goal / Math.max(taiPriceUsd, 0.000000001)), [goal, taiPriceUsd]);
  const isZh = locale === 'zh';

  return (
    <div className="flex-1 flex flex-col app-atmosphere safe-content-bottom p-5 text-ink animate-in fade-in duration-500 grid-background">
      <div className="neo-card-dark p-5 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-12 -right-10 h-44 w-44 rounded-full bg-primary/18 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-accent/18 blur-3xl" />

        <div className="relative z-10">
          <p className="section-kicker text-accent">{isZh ? '入场引导' : 'Onboarding'}</p>
          <h1 className="text-3xl font-black tracking-tight mt-1">{isZh ? '设定你的存款战役' : 'Set Your Deposit Campaign'}</h1>
          <p className="text-xs font-bold text-white/75 mt-2">
            {isZh ? '先设定目标，再完成任务与邀请，逐步解锁奖励。' : 'Set your goal first, then complete missions and invites to unlock rewards.'}
          </p>

          <div className="grid grid-cols-3 gap-2 text-[10px] font-black mt-3">
            <span className="bg-primary text-bg-dark brutal-border-thin rounded-lg px-2 py-1 text-center">{isZh ? '设目标' : 'Set Goal'}</span>
            <span className="bg-white/12 text-white brutal-border-thin rounded-lg px-2 py-1 text-center">{isZh ? '做任务' : 'Do Missions'}</span>
            <span className="bg-white/12 text-white brutal-border-thin rounded-lg px-2 py-1 text-center">{isZh ? '领奖励' : 'Claim Rewards'}</span>
          </div>
        </div>
      </div>

      <div className="neo-card p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="section-kicker">{isZh ? '当前价格' : 'Current Price'}</p>
          <p className="text-xs font-black text-black/75">
            {priceLoading ? (isZh ? '读取中...' : 'Loading...') : formatUsdPerTai(taiPriceUsd, locale)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          {[100000, 500000, 1000000, 3000000].map((v) => (
            <button
              key={v}
              className={`px-3 py-3 font-black text-xs brutal-border-thin rounded-xl transition ${goal === v ? 'bg-bg-dark text-primary border-primary/45' : 'bg-white text-black'}`}
              onClick={() => setGoal(v)}
            >
              {formatUsd(v, locale)}
            </button>
          ))}
        </div>

        <div className="mt-3">
          <p className="section-kicker">{isZh ? '自定义目标（USD）' : 'Custom Target (USD)'}</p>
          <input
            className="w-full brutal-border-thin bg-white p-3 text-2xl font-black mt-2 rounded-xl"
            type="number"
            min={10000}
            value={goal}
            onChange={(e) => setGoal(Number(e.target.value || 0))}
          />
        </div>

        <div className="mt-3 bg-primary/12 border border-primary/25 p-3 rounded-xl">
          <p className="text-[10px] font-black">{isZh ? '预计所需 TAI' : 'Estimated TAI Needed'}</p>
          <p className="text-xl font-black mt-0.5">{needTai.toLocaleString()}</p>
          <p className="text-[10px] font-bold opacity-70 mt-1">
            {isZh ? '提示：创建后目标金额不可修改，需达标后才能领取。' : 'Note: Goal amount is immutable after create and claim is enabled only when reached.'}
          </p>
        </div>
      </div>

      <button
        onClick={() => {
          onSetGoal(goal);
          navigate('/home');
        }}
        className="w-full tai-btn tai-btn-primary shadow-brutal-lg hover-lift"
      >
        <span className="text-lg font-black">{isZh ? '创建我的战役' : 'Start My Campaign'}</span>
      </button>
    </div>
  );
};

export default Onboarding;
