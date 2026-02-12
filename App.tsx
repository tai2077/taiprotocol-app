import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useTonAddress, useTonWallet } from '@tonconnect/ui-react';
import { Address } from '@ton/core';
import NavBar from './components/NavBar';
import TopBar from './components/TopBar';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import { api } from './lib/api';
import { isTelegramInApp } from './lib/config';
import { toTaiNumber } from './lib/format';
import { safeGetStorage, safeSetStorage } from './lib/storage';
import { DepositGoal, UserStats } from './types';

const Dashboard = lazy(() => import('./screens/Dashboard'));
const Vault = lazy(() => import('./screens/Vault'));
const Missions = lazy(() => import('./screens/Missions'));
const Invite = lazy(() => import('./screens/Invite'));
const Shop = lazy(() => import('./screens/Shop'));
const Rewards = lazy(() => import('./screens/Rewards'));
const Unlocks = lazy(() => import('./screens/Unlocks'));
const FixedStake = lazy(() => import('./screens/FixedStake'));
const Leaderboard = lazy(() => import('./screens/Leaderboard'));
const Achievements = lazy(() => import('./screens/Achievements'));
const Profile = lazy(() => import('./screens/Profile'));

const INITIAL_STATS: UserStats = {
  rank: null,
  tonBalance: 0,
  taiBalance: 0,
  lockedTai: 0,
  pendingTai: 0,
  points: 0,
  wealthGoalUsd: 1_000_000,
  onchainTai: 0,
};

const GOALS_STORAGE_PREFIX = 'tai:deposit-goals:v1:';
const LOCALE_STORAGE_KEY = 'tai:locale:v1';

function sanitizeGoal(input: any): DepositGoal | null {
  if (!input || typeof input !== 'object') return null;
  const id = String(input.id || '');
  const targetUsd = Number(input.targetUsd || 0);
  const depositedTai = Number(input.depositedTai || 0);
  const createdAt = Number(input.createdAt || Date.now());
  const claimed = Boolean(input.claimed);
  if (!id || targetUsd <= 0 || depositedTai < 0) return null;
  return { id, targetUsd, depositedTai, createdAt, claimed };
}

function parseStoredGoals(raw: string | null): DepositGoal[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => sanitizeGoal(item))
      .filter((goal): goal is DepositGoal => Boolean(goal));
  } catch {
    return [];
  }
}

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

function toFriendlyAddress(address: string | null): string | null {
  if (!address) return null;
  try {
    return Address.parse(address).toString({ bounceable: false, urlSafe: true, testOnly: false });
  } catch {
    return null;
  }
}

function resolvePointsField(input: unknown): number {
  if (!input || typeof input !== 'object') return 0;
  const source = input as { pointsTotal?: unknown; pointsBalance?: unknown; score?: unknown };
  return toTaiNumber(source.pointsTotal ?? source.pointsBalance ?? source.score ?? 0);
}

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const wallet = useTonWallet();
  const rawAddressFromHook = useTonAddress(false) || null;
  const friendlyAddressFromHook = useTonAddress(true) || null;
  const [stats, setStats] = useState<UserStats>(INITIAL_STATS);
  const [depositGoals, setDepositGoals] = useState<DepositGoal[]>([]);
  const [locale, setLocale] = useState<'zh' | 'en'>(() => {
    const saved = safeGetStorage(LOCALE_STORAGE_KEY);
    return saved === 'en' ? 'en' : 'zh';
  });
  const [navMode, setNavMode] = useState<'bottom' | 'top-right'>(() => (isTelegramInApp() ? 'bottom' : 'top-right'));

  const rawWalletAddress = wallet?.account.address || rawAddressFromHook;
  const friendlyWalletAddress = friendlyAddressFromHook || toFriendlyAddress(rawWalletAddress);
  const walletAddress = friendlyWalletAddress || rawWalletAddress;
  const addressCandidates = useMemo(
    () => Array.from(new Set([friendlyWalletAddress, rawWalletAddress].filter((item): item is string => Boolean(item)))),
    [friendlyWalletAddress, rawWalletAddress]
  );

  useEffect(() => {
    safeSetStorage(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en-US';
  }, [locale]);

  useEffect(() => {
    const syncNavMode = () => {
      setNavMode(isTelegramInApp() ? 'bottom' : 'top-right');
    };

    syncNavMode();
    window.addEventListener('focus', syncNavMode);
    window.addEventListener('pageshow', syncNavMode as EventListener);
    return () => {
      window.removeEventListener('focus', syncNavMode);
      window.removeEventListener('pageshow', syncNavMode as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!walletAddress || addressCandidates.length === 0) {
      setStats((prev) => ({ ...prev, ...INITIAL_STATS, wealthGoalUsd: prev.wealthGoalUsd }));
      return;
    }

    let cancelled = false;

    const fetchFirstByAddress = async <T,>(fn: (address: string) => Promise<T>): Promise<T | null> => {
      for (const candidate of addressCandidates) {
        try {
          return await fn(candidate);
        } catch {
          // try next
        }
      }
      return null;
    };

    (async () => {
      const [portfolioResult, claimableResult, tonBalanceResult] = await Promise.allSettled([
        fetchFirstByAddress(api.getPortfolio),
        fetchFirstByAddress(api.getClaimable),
        api.getTonBalance(addressCandidates[0]),
      ]);

      if (cancelled) return;

      const portfolio = portfolioResult.status === 'fulfilled' ? portfolioResult.value : null;
      const claimable = claimableResult.status === 'fulfilled' ? claimableResult.value : null;
      const tonBalance = tonBalanceResult.status === 'fulfilled' ? tonBalanceResult.value : 0;

      const taiBalance = toTaiNumber(portfolio?.walletBalance || 0);
      const pendingByPortfolio = toTaiNumber(portfolio?.totalPending || 0);
      const pendingByClaimable = claimable ? toTaiNumber(claimable.pendingTotalTai) : 0;
      const pendingTai = pendingByClaimable > 0 ? pendingByClaimable : pendingByPortfolio;
      const pointsByClaimable = resolvePointsField(claimable);
      const pointsByPortfolio = resolvePointsField(portfolio);
      const points = Math.max(Math.round(pointsByClaimable || pointsByPortfolio || pendingTai), 0);

      setStats((prev) => ({
        ...prev,
        tonBalance,
        taiBalance,
        pendingTai,
        points,
        onchainTai: taiBalance + prev.lockedTai,
      }));
    })();

    return () => {
      cancelled = true;
    };
  }, [walletAddress, addressCandidates]);

  useEffect(() => {
    if (!walletAddress || addressCandidates.length === 0) {
      setDepositGoals([]);
      setStats((prev) => ({ ...prev, lockedTai: 0, onchainTai: prev.taiBalance }));
      return;
    }

    const primaryKey = `${GOALS_STORAGE_PREFIX}${walletAddress}`;
    const fallbackKey =
      rawWalletAddress && rawWalletAddress !== walletAddress ? `${GOALS_STORAGE_PREFIX}${rawWalletAddress}` : null;

    const localGoalsPrimary = parseStoredGoals(safeGetStorage(primaryKey));
    const localGoalsFallback = fallbackKey ? parseStoredGoals(safeGetStorage(fallbackKey)) : [];
    const localGoals = localGoalsPrimary.length > 0 ? localGoalsPrimary : localGoalsFallback;
    setDepositGoals(localGoals);

    const localLockedTai = localGoals
      .filter((goal) => !goal.claimed)
      .reduce((sum, goal) => sum + goal.depositedTai, 0);
    setStats((prev) => ({ ...prev, lockedTai: localLockedTai, onchainTai: prev.taiBalance + localLockedTai }));

    let cancelled = false;

    (async () => {
      try {
        let chainData: Awaited<ReturnType<typeof api.getDepositGoals>> | null = null;
        for (const candidate of addressCandidates) {
          try {
            chainData = await api.getDepositGoals(candidate);
            break;
          } catch {
            // try next candidate
          }
        }
        if (!chainData) return;
        const chainGoals = (chainData.goals || []).map((goal) => {
          const targetUsd = nanoToNumber(goal.target_usd_nano);
          const depositedTai = nanoToNumber(goal.deposited_tai_nano);
          const createdAt = Number(goal.created_at || Date.now()) * 1000;
          return sanitizeGoal({
            id: goal.id,
            targetUsd,
            depositedTai,
            createdAt,
            claimed: goal.claimed,
          });
        }).filter((goal): goal is DepositGoal => Boolean(goal));

        const chainIds = new Set(chainGoals.map((goal) => goal.id));
        const localClaimed = localGoals.filter((goal) => goal.claimed && !chainIds.has(goal.id));
        const merged = [...chainGoals, ...localClaimed].sort((a, b) => b.createdAt - a.createdAt);
        const lockedTai = chainGoals
          .filter((goal) => !goal.claimed)
          .reduce((sum, goal) => sum + goal.depositedTai, 0);

        if (!cancelled) {
          setDepositGoals(merged);
          setStats((prev) => ({ ...prev, lockedTai, onchainTai: prev.taiBalance + lockedTai }));
        }
      } catch {
        // keep local fallback when chain query fails
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [walletAddress, rawWalletAddress, addressCandidates]);

  useEffect(() => {
    if (!walletAddress) return;
    const serialized = JSON.stringify(depositGoals);
    safeSetStorage(`${GOALS_STORAGE_PREFIX}${walletAddress}`, serialized);
    if (rawWalletAddress && rawWalletAddress !== walletAddress) {
      safeSetStorage(`${GOALS_STORAGE_PREFIX}${rawWalletAddress}`, serialized);
    }
  }, [walletAddress, rawWalletAddress, depositGoals]);

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    const backButton = webApp?.BackButton;
    if (!backButton) return;

    const shouldShowBack = location.pathname !== '/home';
    if (!shouldShowBack) {
      backButton.hide();
      return;
    }

    const onBack = () => navigate(-1);
    backButton.show();
    backButton.onClick(onBack);
    return () => {
      backButton.offClick(onBack);
      backButton.hide();
    };
  }, [location.pathname, navigate]);

  const actions = useMemo(
    () => ({
      createDepositGoal: (goalId: string, targetUsd: number, depositedTai: number) => {
        let reason = '';
        let created = false;

        setDepositGoals((prev) => {
          if (prev.some((goal) => goal.id === goalId)) {
            reason = 'DUPLICATE_GOAL';
            return prev;
          }
          const activeCount = prev.filter((goal) => !goal.claimed).length;
          if (activeCount >= 3) {
            reason = 'MAX_GOALS';
            return prev;
          }
          if (depositedTai <= 0 || targetUsd <= 0) {
            reason = 'INVALID_PARAMS';
            return prev;
          }
          created = true;
          return [
            {
              id: goalId,
              targetUsd,
              depositedTai,
              createdAt: Date.now(),
              claimed: false,
            },
            ...prev,
          ];
        });

        if (!created) return { ok: false, reason };

        setStats((prev) => ({
          ...prev,
          taiBalance: Math.max(prev.taiBalance - depositedTai, 0),
          lockedTai: prev.lockedTai + depositedTai,
          onchainTai: Math.max(prev.taiBalance - depositedTai, 0) + (prev.lockedTai + depositedTai),
        }));

        return { ok: true as const };
      },
      topUpDepositGoal: (id: string, additionalTai: number) => {
        let reason = '';
        let topped = false;

        setDepositGoals((prev) =>
          prev.map((goal) => {
            if (goal.id !== id) return goal;
            if (goal.claimed) {
              reason = 'GOAL_CLAIMED';
              return goal;
            }
            if (additionalTai <= 0) {
              reason = 'INVALID_PARAMS';
              return goal;
            }
            topped = true;
            return { ...goal, depositedTai: goal.depositedTai + additionalTai };
          })
        );

        if (!topped) return { ok: false as const, reason };

        setStats((prev) => ({
          ...prev,
          taiBalance: Math.max(prev.taiBalance - additionalTai, 0),
          lockedTai: prev.lockedTai + additionalTai,
          onchainTai: Math.max(prev.taiBalance - additionalTai, 0) + (prev.lockedTai + additionalTai),
        }));

        return { ok: true as const };
      },
      claimDepositGoal: (id: string) => {
        let releasedTai = 0;
        setDepositGoals((prev) =>
          prev.map((goal) => {
            if (goal.id === id && !goal.claimed) {
              releasedTai = goal.depositedTai;
              return { ...goal, claimed: true };
            }
            return goal;
          })
        );

        if (releasedTai > 0) {
          setStats((prev) => ({
            ...prev,
            taiBalance: prev.taiBalance + releasedTai,
            lockedTai: Math.max(prev.lockedTai - releasedTai, 0),
            onchainTai: (prev.taiBalance + releasedTai) + Math.max(prev.lockedTai - releasedTai, 0),
          }));
        }
      },
    }),
    []
  );

  const showNav = location.pathname !== '/';
  const routeTitle =
    ({
      zh: {
        '/home': '通往财富自由之路',
        '/sale': '补给中心',
        '/deposit': '资产',
        '/stake': '固定质押',
        '/invite': '积分 · 邀请',
        '/rewards': '积分',
        '/unlocks': '积分 · 解锁',
        '/leaderboard': '榜单',
        '/missions': '积分 · 任务',
        '/achievements': '成就',
        '/profile': '我的',
      },
      en: {
        '/home': 'Road to Financial Freedom',
        '/sale': 'Supply Center',
        '/deposit': 'Assets',
        '/stake': 'Fixed Stake',
        '/invite': 'Points · Invite',
        '/rewards': 'Points',
        '/unlocks': 'Points · Unlocks',
        '/leaderboard': 'Leaderboard',
        '/missions': 'Points · Missions',
        '/achievements': 'Achievements',
        '/profile': 'Profile',
      },
    } as const)[locale][location.pathname] || (locale === 'zh' ? 'TAI 协议' : 'TAI Protocol');

  useEffect(() => {
    const brand = locale === 'zh' ? 'TAI 协议' : 'TAI Protocol';
    document.title = routeTitle === brand ? brand : `${routeTitle} | ${brand}`;
  }, [locale, routeTitle]);

  return (
    <div className="min-h-screen app-atmosphere flex justify-center px-0 sm:px-4">
      <div className={`app-shell-frame w-full max-w-[520px] min-h-screen flex flex-col relative ${navMode === 'top-right' ? 'nav-mode-top-right' : ''}`}>
        {showNav && (
          <TopBar
            title={routeTitle}
            walletAddress={walletAddress}
            locale={locale}
            onToggleLocale={() => setLocale((prev) => (prev === 'zh' ? 'en' : 'zh'))}
            navMode={navMode}
          />
        )}
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="neo-card px-5 py-4 text-xs font-black">{locale === 'zh' ? '加载中...' : 'Loading...'}</div>
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Dashboard stats={stats} goals={depositGoals} walletAddress={walletAddress} locale={locale} />} />
            <Route path="/sale" element={<Shop walletAddress={walletAddress} locale={locale} />} />
            <Route
              path="/deposit"
              element={
                <Vault
                  goals={depositGoals}
                  availableTai={stats.taiBalance}
                  onCreateGoal={actions.createDepositGoal}
                  onTopUpGoal={actions.topUpDepositGoal}
                  onClaimGoal={actions.claimDepositGoal}
                  walletAddress={walletAddress}
                  locale={locale}
                />
              }
            />
            <Route path="/stake" element={<FixedStake walletAddress={walletAddress} locale={locale} />} />
            <Route path="/invite" element={<Invite walletAddress={walletAddress} locale={locale} />} />
            <Route path="/rewards" element={<Rewards walletAddress={walletAddress} locale={locale} points={stats.points} />} />
            <Route path="/unlocks" element={<Unlocks walletAddress={walletAddress} locale={locale} points={stats.points} />} />
            <Route path="/leaderboard" element={<Leaderboard rank={stats.rank ?? 0} walletAddress={walletAddress} locale={locale} />} />
            <Route path="/missions" element={<Missions stats={stats} goals={depositGoals} walletAddress={walletAddress} locale={locale} />} />
            <Route path="/achievements" element={<Achievements locale={locale} />} />
            <Route path="/profile" element={<Profile stats={stats} walletAddress={walletAddress} locale={locale} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        {showNav && <PwaInstallPrompt locale={locale} />}
        {showNav && navMode === 'bottom' && <NavBar locale={locale} />}
      </div>
    </div>
  );
};

export default App;
