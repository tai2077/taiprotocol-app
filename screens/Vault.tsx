import React, { useEffect, useMemo, useState } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { DepositGoal } from '../types';
import { api } from '../lib/api';
import { useToast } from '../components/ToastProvider';
import { AppLocale, formatTai, formatUsd, formatUsdPerTai } from '../lib/format';
import { pollUntil } from '../lib/txConfirm';

interface VaultProps {
  goals: DepositGoal[];
  availableTai: number;
  onCreateGoal: (goalId: string, targetUsd: number, depositedTai: number) => { ok: true } | { ok: false; reason?: string };
  onTopUpGoal: (id: string, additionalTai: number) => { ok: true } | { ok: false; reason?: string };
  onClaimGoal: (id: string) => void;
  walletAddress: string | null;
  locale: AppLocale;
}

const PRESET_TARGETS = [100000, 500000, 1000000, 3000000];
const NANO_PER_TAI = 1_000_000_000n;

function nanoToNumber(value: string, decimals = 9): number {
  try {
    const base = 10n ** BigInt(decimals);
    const nano = BigInt(String(value || '0'));
    const whole = Number(nano / base);
    const fraction = Number(nano % base) / Number(base);
    return whole + fraction;
  } catch {
    return 0;
  }
}

const Vault: React.FC<VaultProps> = ({ goals, availableTai, onCreateGoal, onTopUpGoal, onClaimGoal, walletAddress, locale }) => {
  const [tonConnectUI] = useTonConnectUI();
  const { notify } = useToast();
  const isZh = locale === 'zh';
  const numberLocale = isZh ? 'zh-CN' : 'en-US';

  const [targetUsd, setTargetUsd] = useState(100000);
  const [taiPriceUsd, setTaiPriceUsd] = useState(0.00008);
  const [priceLoading, setPriceLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [topUpId, setTopUpId] = useState('');

  useEffect(() => {
    let mounted = true;
    let timer = 0;

    const fetchPrice = async () => {
      try {
        const data = await api.getPrice();
        const next = Number(data?.price);
        if (!mounted || !Number.isFinite(next) || next <= 0) return;
        setTaiPriceUsd(next);
      } catch {
        // keep last known price
      } finally {
        if (mounted) setPriceLoading(false);
      }
    };

    fetchPrice();
    timer = window.setInterval(fetchPrice, 15000);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const activeGoals = useMemo(() => goals.filter((g) => !g.claimed), [goals]);
  const requiredTaiNow = useMemo(
    () => Math.max(1, Math.ceil(targetUsd / Math.max(taiPriceUsd, 0.000000001))),
    [targetUsd, taiPriceUsd]
  );
  const totalLockedTai = useMemo(() => activeGoals.reduce((sum, g) => sum + g.depositedTai, 0), [activeGoals]);

  const createGoal = async () => {
    if (!walletAddress) return tonConnectUI.openModal();
    if (!Number.isFinite(targetUsd) || targetUsd < 1000) return notify(isZh ? '目标金额至少为 $1,000' : 'Target must be at least $1,000', 'error');
    if (activeGoals.length >= 3) return notify(isZh ? '最多仅可同时拥有 3 个目标' : 'Maximum 3 active goals', 'error');
    if (requiredTaiNow > availableTai) return notify(isZh ? '可用 TAI 不足，请先补给后再创建' : 'Insufficient TAI, please top up first', 'error');

    const targetUsdNano = BigInt(Math.round(targetUsd * 1_000_000_000));
    const amountNano = BigInt(requiredTaiNow) * NANO_PER_TAI;
    const beforeGoals = await api.getDepositGoals(walletAddress).catch(() => null);

    setSubmitting(true);
    try {
      const tx = await api.buildDepositCreateTx({
        wallet_address: walletAddress,
        target_usd_nano: targetUsdNano.toString(),
        amount_nano: amountNano.toString(),
      });

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{ address: tx.to, amount: tx.tonAmount, payload: tx.payload }],
      });

      const confirmed = await pollUntil(
        () => api.getDepositGoals(walletAddress),
        (next) => {
          if (tx.predictedGoalId) {
            return next.goals.some((goal) => String(goal.id) === String(tx.predictedGoalId));
          }
          if (beforeGoals) return next.goals.length > beforeGoals.goals.length;
          return next.goals.length > 0;
        },
        { timeoutMs: 90_000, intervalMs: 3_000 }
      );

      const goalFromChain =
        confirmed?.goals.find((goal) => (tx.predictedGoalId ? String(goal.id) === String(tx.predictedGoalId) : true)) ||
        null;
      if (!goalFromChain) {
        notify(isZh ? '交易已提交，等待链上确认' : 'Transaction submitted, waiting for on-chain confirmation', 'info');
        return;
      }

      const result = onCreateGoal(
        String(goalFromChain.id),
        nanoToNumber(goalFromChain.target_usd_nano),
        nanoToNumber(goalFromChain.deposited_tai_nano)
      );
      if (!result.ok) {
        const reason = 'reason' in result ? result.reason : undefined;
        if (reason === 'MAX_GOALS') return notify(isZh ? '最多仅可同时拥有 3 个目标' : 'Maximum 3 active goals', 'error');
        if (reason === 'INVALID_PARAMS') return notify(isZh ? '目标参数无效' : 'Invalid goal parameters', 'error');
        return notify(isZh ? '创建目标失败' : 'Create goal failed', 'error');
      }

      notify(isZh ? `目标已链上确认：${formatUsd(targetUsd, locale)}` : `Goal confirmed: ${formatUsd(targetUsd, locale)}`, 'success');
    } catch (error) {
      const msg = error instanceof Error ? error.message : isZh ? '交易已取消或失败' : 'Transaction cancelled or failed';
      notify(msg || (isZh ? '链上创建失败' : 'On-chain creation failed'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const topUpGoal = async (goal: DepositGoal, taiGap: number) => {
    if (!walletAddress) return tonConnectUI.openModal();
    if (goal.claimed) return notify(isZh ? '目标已领取，无需补存' : 'Goal already claimed', 'info');
    if (taiGap <= 0) return notify(isZh ? '当前目标已达标，无需补存' : 'Goal already reached', 'info');

    const topUpAmount = Math.min(taiGap, availableTai);
    if (topUpAmount <= 0) return notify(isZh ? '可用 TAI 不足，无法补存' : 'Insufficient TAI for top-up', 'error');

    const amountNano = BigInt(topUpAmount) * NANO_PER_TAI;
    const beforeDepositedNano = BigInt(Math.round(goal.depositedTai * 1_000_000_000));

    setTopUpId(goal.id);
    try {
      const tx = await api.buildDepositTopupTx({
        wallet_address: walletAddress,
        goal_id: goal.id,
        amount_nano: amountNano.toString(),
      });

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{ address: tx.to, amount: tx.tonAmount, payload: tx.payload }],
      });

      const confirmed = await pollUntil(
        () => api.getDepositGoals(walletAddress),
        (next) => {
          const chainGoal = next.goals.find((g) => String(g.id) === String(goal.id));
          if (!chainGoal) return false;
          try {
            return BigInt(chainGoal.deposited_tai_nano) > beforeDepositedNano;
          } catch {
            return false;
          }
        },
        { timeoutMs: 90_000, intervalMs: 3_000 }
      );

      const chainGoal = confirmed?.goals.find((g) => String(g.id) === String(goal.id));
      if (!chainGoal) {
        notify(isZh ? '交易已提交，等待链上确认' : 'Transaction submitted, waiting for on-chain confirmation', 'info');
        return;
      }

      const updatedTai = nanoToNumber(chainGoal.deposited_tai_nano);
      const additionalTai = Math.max(0, updatedTai - goal.depositedTai);
      const result = onTopUpGoal(goal.id, additionalTai);
      if (!result.ok) {
        notify(isZh ? '补存失败，请重试' : 'Top-up failed, please retry', 'error');
        return;
      }
      notify(isZh ? `补存已链上确认：${formatTai(additionalTai, locale)}` : `Top-up confirmed: ${formatTai(additionalTai, locale)}`, 'success');
    } catch (error) {
      const msg = error instanceof Error ? error.message : isZh ? '交易已取消或失败' : 'Transaction cancelled or failed';
      notify(msg || (isZh ? '补存失败，请重试' : 'Top-up failed, please retry'), 'error');
    } finally {
      setTopUpId('');
    }
  };

  const claimGoal = async (goal: DepositGoal) => {
    if (!walletAddress) return tonConnectUI.openModal();
    const currentValue = goal.depositedTai * taiPriceUsd;
    if (goal.claimed) return notify(isZh ? '该目标已领取' : 'Goal already claimed', 'info');
    if (currentValue < goal.targetUsd) return notify(isZh ? '未达到目标金额，暂不可领取' : 'Target not reached yet', 'error');

    try {
      const tx = await api.buildDepositClaimTx({ goal_id: goal.id });
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{ address: tx.to, amount: tx.tonAmount, payload: tx.payload }],
      });

      const confirmed = await pollUntil(
        () => api.getDepositGoals(walletAddress || ''),
        (next) => {
          const chainGoal = next.goals.find((g) => String(g.id) === String(goal.id));
          return Boolean(chainGoal?.claimed);
        },
        { timeoutMs: 90_000, intervalMs: 3_000 }
      );

      const chainGoal = confirmed?.goals.find((g) => String(g.id) === String(goal.id));
      if (chainGoal?.claimed) {
        onClaimGoal(goal.id);
        notify(isZh ? '领取已链上确认' : 'Claim confirmed on-chain', 'success');
        return;
      }
      notify(isZh ? '交易已提交，等待链上确认' : 'Transaction submitted, waiting for on-chain confirmation', 'info');
    } catch (error) {
      const msg = error instanceof Error ? error.message : isZh ? '交易已取消或失败' : 'Transaction cancelled or failed';
      notify(msg || (isZh ? '领取失败，请重试' : 'Claim failed, please retry'), 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col safe-content-bottom p-4 gap-4 animate-in fade-in duration-300 grid-background">
      <div className="neo-card-dark p-5 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-14 -left-8 h-32 w-32 rounded-full bg-accent/18 blur-3xl" />
        <div className="flex items-start justify-between gap-3">
          <div className="relative z-10">
            <p className="section-kicker text-accent">{isZh ? '存款游戏引擎' : 'Deposit Engine'}</p>
            <h2 className="text-2xl font-black tracking-tight">{isZh ? '目标锁定仓' : 'Goal Vault'}</h2>
          </div>
          <div className="bg-primary text-black brutal-border-thin rounded-xl px-3 py-2 text-center min-w-[78px] relative z-10">
            <p className="text-[10px] font-black">{isZh ? '槽位' : 'Slots'}</p>
            <p className="text-lg font-black">{activeGoals.length}/3</p>
          </div>
        </div>
        <p className="text-xs font-bold text-white/70 mt-2 relative z-10">
          {isZh ? '目标金额固定不变，TAI 需求随价格波动。未达标不可领取。' : 'Goal amount is fixed. Required TAI changes with price. Claim is blocked until target is reached.'}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 relative z-10">
          <div className="bg-white/10 brutal-border-thin rounded-xl px-3 py-2">
            <p className="text-[10px] font-bold text-white/65">{isZh ? '可用 TAI' : 'Available TAI'}</p>
            <p className="text-sm font-black">{formatTai(availableTai, locale)}</p>
          </div>
          <div className="bg-white/10 brutal-border-thin rounded-xl px-3 py-2">
            <p className="text-[10px] font-bold text-white/65">{isZh ? '已锁定' : 'Locked'}</p>
            <p className="text-sm font-black">{formatTai(totalLockedTai, locale)}</p>
          </div>
        </div>
        <div className="mt-3 space-y-1 text-[11px] font-bold text-white/75 relative z-10">
          <p>{isZh ? '规则 1：每个用户最多同时持有 3 个存款目标' : 'Rule 1: Maximum 3 active goals per user'}</p>
          <p>{isZh ? '规则 2：创建后不可修改目标金额，可追加补存' : 'Rule 2: Goal amount is immutable after create; top-up is allowed'}</p>
          <p>{isZh ? '规则 3：达标后一次性领取，未达标不可领取' : 'Rule 3: Claim once when target is reached'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="neo-card p-4">
          <p className="section-kicker">{isZh ? '当前价格' : 'Current Price'}</p>
          <p className="text-xl font-black mt-1">{priceLoading ? (isZh ? '读取中...' : 'Loading...') : formatUsdPerTai(taiPriceUsd, locale)}</p>
          <p className="text-[10px] font-bold opacity-70 mt-1">{isZh ? '15 秒刷新' : 'Refreshes every 15s'}</p>
        </div>
        <div className="neo-card p-4">
          <p className="section-kicker">{isZh ? '达标所需' : 'Need for Target'}</p>
          <p className="text-xl font-black mt-1">{formatTai(requiredTaiNow, locale)}</p>
          <p className="text-[10px] font-bold opacity-70 mt-1">{isZh ? '当前选择目标' : 'Selected target'} {formatUsd(targetUsd, locale)}</p>
        </div>
      </div>

      <div className="neo-card p-4 space-y-3">
        <label className="text-[10px] font-black">{isZh ? '选择目标金额（USD）' : 'Select Target (USD)'}</label>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_TARGETS.map((item) => (
            <button
              key={item}
              className={`px-3 py-2 brutal-border-thin rounded-xl font-black text-xs ${targetUsd === item ? 'bg-bg-dark text-primary border-primary/45' : 'bg-white text-black'}`}
              onClick={() => setTargetUsd(item)}
            >
              {formatUsd(item, locale)}
            </button>
          ))}
        </div>

        <label className="text-[10px] font-black">{isZh ? '自定义目标（USD）' : 'Custom Target (USD)'}</label>
        <input
          className="w-full brutal-border-thin bg-white p-3 font-black text-xl rounded-xl"
          type="number"
          min={1000}
          value={targetUsd}
          onChange={(e) => setTargetUsd(Number(e.target.value || 0))}
        />

        <div className="bg-primary/10 border border-primary/25 p-3 rounded-xl">
          <p className="text-[10px] font-black">{isZh ? '按当前价格需锁定' : 'Required at Current Price'}</p>
          <p className="text-xl font-black">{formatTai(requiredTaiNow, locale)}</p>
          <p className="text-[10px] font-bold opacity-70 mt-1">
            {isZh ? `目标固定为 ${formatUsd(targetUsd, locale)}，创建后不可修改` : `Goal is fixed at ${formatUsd(targetUsd, locale)} after creation`}
          </p>
        </div>

        <button className="w-full tai-btn tai-btn-primary hover-lift disabled:opacity-50 disabled:cursor-not-allowed" onClick={createGoal} disabled={submitting || activeGoals.length >= 3}>
          {activeGoals.length >= 3 ? (isZh ? '已达目标上限' : 'Goal limit reached') : submitting ? (isZh ? '提交中...' : 'Submitting...') : isZh ? '创建并锁定目标' : 'Create & Lock Goal'}
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <div className="px-3 py-1.5 rounded-full bg-bg-dark text-white text-[10px] font-black whitespace-nowrap">{isZh ? '全部目标' : 'All Goals'} · {goals.length}</div>
        <div className="px-3 py-1.5 rounded-full bg-white brutal-border-thin text-[10px] font-black whitespace-nowrap">{isZh ? '进行中' : 'Active'} · {activeGoals.length}</div>
        <div className="px-3 py-1.5 rounded-full bg-white brutal-border-thin text-[10px] font-black whitespace-nowrap">{isZh ? '已领取' : 'Claimed'} · {goals.length - activeGoals.length}</div>
      </div>

      <div className="space-y-3">
        {goals.length === 0 && <p className="text-xs font-black text-black/60">{isZh ? '暂无存款目标' : 'No deposit goals yet'}</p>}
        {goals.map((goal, idx) => {
          const currentValue = goal.depositedTai * taiPriceUsd;
          const reached = currentValue >= goal.targetUsd;
          const progress = Math.min(100, Math.round((currentValue / Math.max(goal.targetUsd, 1)) * 100));
          const needTaiAtCurrentPrice = Math.max(1, Math.ceil(goal.targetUsd / Math.max(taiPriceUsd, 0.000000001)));
          const taiGap = Math.max(0, needTaiAtCurrentPrice - goal.depositedTai);
          const topUpAmount = Math.min(taiGap, availableTai);

          return (
            <div key={goal.id} className="neo-card p-4 hover-lift">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="section-kicker">{isZh ? '目标' : 'Goal'} #{idx + 1}</p>
                  <p className="text-lg font-black">{formatUsd(goal.targetUsd, locale)}</p>
                </div>
                <span className={`px-2.5 py-1 text-[10px] font-black rounded-full brutal-border-thin ${goal.claimed ? 'bg-bg-dark text-white' : reached ? 'bg-primary text-black border-primary/50' : 'bg-white text-black'}`}>
                  {goal.claimed ? (isZh ? '已领取' : 'Claimed') : reached ? (isZh ? '可领取' : 'Claimable') : isZh ? '未达标' : 'Not Reached'}
                </span>
              </div>

              <div className="mt-2 space-y-1 text-[11px] font-bold text-black/75">
                <p>{isZh ? '已锁定：' : 'Locked: '}{formatTai(goal.depositedTai, locale)}</p>
                <p>{isZh ? '当前估值：' : 'Current Value: '}{formatUsd(currentValue, locale, 2)}</p>
                <p>{isZh ? '当前达标所需：' : 'Needed at Current Price: '}{formatTai(needTaiAtCurrentPrice, locale)}</p>
                {!reached && <p>{isZh ? '按当前价格还差：' : 'Gap at Current Price: '}{formatTai(taiGap, locale)}</p>}
                <p>{isZh ? '创建时间：' : 'Created: '}{new Date(goal.createdAt).toLocaleString()}</p>
              </div>

              <div className="mt-3">
                <div className="h-3 bg-black/10 brutal-border-thin rounded-full overflow-hidden p-[1px]">
                  <div className="h-full bg-gradient-to-r from-accent to-primary transition-all duration-500 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-[10px] font-black mt-1">{isZh ? '目标进度' : 'Progress'} {progress}%</p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  className="w-full tai-btn tai-btn-soft disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={goal.claimed || reached || topUpAmount <= 0}
                  onClick={() => topUpGoal(goal, taiGap)}
                >
                  {topUpId === goal.id
                    ? (isZh ? '补存中...' : 'Top-up...')
                    : topUpAmount > 0
                      ? (isZh
                        ? `一键补存 ${topUpAmount.toLocaleString(numberLocale)}`
                        : `Top-up ${topUpAmount.toLocaleString(numberLocale)}`)
                      : isZh
                        ? '可用 TAI 不足'
                        : 'Not enough TAI'}
                </button>
                <button
                  className="w-full tai-btn tai-btn-dark disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={goal.claimed || !reached}
                  onClick={() => claimGoal(goal)}
                >
                  {goal.claimed ? (isZh ? '已领取' : 'Claimed') : reached ? (isZh ? '领取存款' : 'Claim Deposit') : isZh ? '未达标不可领取' : 'Not Reached'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Vault;
