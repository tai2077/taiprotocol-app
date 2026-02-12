import { AppLocale } from './format';

export type PointsScope = 'global' | 'deposit' | 'growth' | 'governance';

export interface PointsRule {
  id: string;
  scope: PointsScope;
  titleZh: string;
  titleEn: string;
  descZh: string;
  descEn: string;
  points: number;
}

export interface PointsProgress {
  walletConnect: boolean;
  createGoal: boolean;
  firstPurchase: boolean;
  inviteOne: boolean;
  signIn7: boolean;
  signIn21: boolean;
  governance: boolean;
  fixedStakeActive: boolean;
  fixedStakeMatured: boolean;
}

export interface PointsLevel {
  id: string;
  minPoints: number;
  titleZh: string;
  titleEn: string;
  priorityBoostBp: number;
}

export interface UnlockRound {
  id: string;
  labelZh: string;
  labelEn: string;
  unlockAt: string;
  priceUsdtPerTai: number;
  totalTai: number;
  priorityTaiCapPerUser: number;
}

export const POINTS_SYSTEM_VERSION = 'v1.1';
export const POINTS_TO_PRIORITY_TAI = 120;
export const FIXED_STAKE_TERM_DAYS = 90;

export const POINTS_RULES: PointsRule[] = [
  {
    id: 'walletConnect',
    scope: 'global',
    titleZh: '连接钱包',
    titleEn: 'Connect Wallet',
    descZh: '完成身份绑定，激活全局积分账户。',
    descEn: 'Bind identity and activate global points account.',
    points: 300,
  },
  {
    id: 'createGoal',
    scope: 'deposit',
    titleZh: '创建存款目标',
    titleEn: 'Create Deposit Goal',
    descZh: '在存款模块创建首个目标并完成锁定。',
    descEn: 'Create and lock your first deposit goal.',
    points: 1200,
  },
  {
    id: 'firstPurchase',
    scope: 'deposit',
    titleZh: '完成首次购买',
    titleEn: 'Complete First Purchase',
    descZh: '完成任意档位购买并记账。',
    descEn: 'Complete any tier purchase and settle ingestion.',
    points: 1800,
  },
  {
    id: 'inviteOne',
    scope: 'growth',
    titleZh: '邀请 1 位有效用户',
    titleEn: 'Invite 1 Valid User',
    descZh: '邀请至少 1 位有效用户参与。',
    descEn: 'Invite at least one valid participating user.',
    points: 900,
  },
  {
    id: 'signIn7',
    scope: 'global',
    titleZh: '连续签到 7 天',
    titleEn: '7-Day Check-in',
    descZh: '完成 7 天连续签到里程碑。',
    descEn: 'Finish 7-day continuous check-in milestone.',
    points: 1400,
  },
  {
    id: 'signIn21',
    scope: 'global',
    titleZh: '连续签到 21 天',
    titleEn: '21-Day Check-in',
    descZh: '完成 21 天连续签到里程碑。',
    descEn: 'Finish 21-day continuous check-in milestone.',
    points: 2600,
  },
  {
    id: 'governance',
    scope: 'governance',
    titleZh: '完成治理任务',
    titleEn: 'Complete Governance Task',
    descZh: '参与治理投票或社区治理任务。',
    descEn: 'Participate in governance vote or governance task.',
    points: 1000,
  },
  {
    id: 'fixedStakeActive',
    scope: 'deposit',
    titleZh: '固定质押进行中',
    titleEn: 'Fixed Stake Active',
    descZh: '固定质押已生效并进入计时。',
    descEn: 'Fixed stake is active and counting down.',
    points: 2200,
  },
  {
    id: 'fixedStakeMatured',
    scope: 'deposit',
    titleZh: '固定质押满 3 个月',
    titleEn: 'Fixed Stake Matured (3M)',
    descZh: '完成固定质押完整周期。',
    descEn: 'Finish full fixed-stake cycle.',
    points: 3500,
  },
];

export const POINTS_LEVELS: PointsLevel[] = [
  { id: 'seed', minPoints: 0, titleZh: 'Seed', titleEn: 'Seed', priorityBoostBp: 10000 },
  { id: 'core', minPoints: 4000, titleZh: 'Core', titleEn: 'Core', priorityBoostBp: 10800 },
  { id: 'pro', minPoints: 9000, titleZh: 'Pro', titleEn: 'Pro', priorityBoostBp: 11600 },
  { id: 'elite', minPoints: 16000, titleZh: 'Elite', titleEn: 'Elite', priorityBoostBp: 12800 },
];

export const DEFAULT_UNLOCK_ROUNDS: UnlockRound[] = [
  {
    id: 'R6',
    labelZh: '第 6 轮解锁',
    labelEn: 'Round 6 Unlock',
    unlockAt: '2026-02-18T12:00:00Z',
    priceUsdtPerTai: 0.00011,
    totalTai: 350000000,
    priorityTaiCapPerUser: 180000,
  },
  {
    id: 'R7',
    labelZh: '第 7 轮解锁',
    labelEn: 'Round 7 Unlock',
    unlockAt: '2026-03-04T12:00:00Z',
    priceUsdtPerTai: 0.00013,
    totalTai: 320000000,
    priorityTaiCapPerUser: 200000,
  },
  {
    id: 'R8',
    labelZh: '第 8 轮解锁',
    labelEn: 'Round 8 Unlock',
    unlockAt: '2026-03-18T12:00:00Z',
    priceUsdtPerTai: 0.00016,
    totalTai: 300000000,
    priorityTaiCapPerUser: 220000,
  },
];

export function resolvePointsLevel(points: number): PointsLevel {
  const safePoints = Number.isFinite(points) ? points : 0;
  let current = POINTS_LEVELS[0];
  for (const level of POINTS_LEVELS) {
    if (safePoints >= level.minPoints) current = level;
  }
  return current;
}

export function calculatePointsFromProgress(progress: PointsProgress) {
  const completedIds = new Set<string>();
  let total = 0;
  for (const rule of POINTS_RULES) {
    const done = progress[rule.id as keyof PointsProgress];
    if (done) {
      completedIds.add(rule.id);
      total += rule.points;
    }
  }
  return {
    totalPoints: total,
    completedIds,
    completedCount: completedIds.size,
  };
}

export function getPointsLabel(level: PointsLevel, locale: AppLocale): string {
  return locale === 'zh' ? level.titleZh : level.titleEn;
}

export function getRoundLabel(round: UnlockRound, locale: AppLocale): string {
  return locale === 'zh' ? round.labelZh : round.labelEn;
}

export function getTimeRemaining(targetTimeMs: number, nowMs = Date.now()) {
  const diff = Math.max(0, targetTimeMs - nowMs);
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  return {
    totalMs: diff,
    days,
    hours,
    minutes,
    expired: diff <= 0,
  };
}

export function computePriorityQuota(points: number, capTai: number) {
  const safePoints = Math.max(0, Math.floor(points));
  const level = resolvePointsLevel(safePoints);
  const boostedPoints = Math.floor((safePoints * level.priorityBoostBp) / 10000);
  const taiByPoints = Math.floor(boostedPoints / POINTS_TO_PRIORITY_TAI);
  const quotaTai = Math.max(0, Math.min(capTai, taiByPoints));
  return {
    level,
    boostedPoints,
    taiByPoints,
    quotaTai,
  };
}
