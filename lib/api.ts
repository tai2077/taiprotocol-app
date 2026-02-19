import { API_BASE, telegramInitData } from './config';

const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 10000);
const RETRIES = 1;
const NANO_PER_TAI = 1_000_000_000n;
const MINI_APP_INVITE_BASE = 'https://mini.tai.lat/sale';

type AnyObject = Record<string, any>;

export interface InviteStatsResponse {
  inviteCode: string;
  inviteLink: string;
  inviteCount: number;
  activatedInvites: number;
  totalInviteRewardsTai: string;
  rebateTier?: string;
  multiplierBp?: number;
}

export interface InviteLeaderboardEntry {
  rank: number;
  address: string;
  inviteCount: number;
  totalRewardsTai: string;
}

export interface InviteTeamMember {
  level: 1 | 2;
  address: string;
  displayAddress: string;
  inviterAddress?: string;
  inviterDisplayAddress?: string;
  status: 'activated' | 'pending';
  tier: number | null;
  rewardAmountNano: string;
  rewardTai: string;
  rewardClaimed: boolean;
  createdAt: string | null;
  subInviteesCount: number;
}

export interface InviteTeamResponse {
  depth: 1 | 2;
  directInvitees: InviteTeamMember[];
  indirectInvitees: InviteTeamMember[];
  stats: {
    directCount: number;
    indirectCount: number;
    activatedDirectCount: number;
    activatedIndirectCount: number;
    totalRewardsNano: string;
    totalRewardsTai: string;
  };
}

export interface InviteSourceResponse {
  walletAddress: string;
  inviter: {
    address: string;
    displayAddress: string;
    inviteCode: string | null;
    teamSize: number;
    totalRewardsNano: string;
    totalRewardsTai: string;
  } | null;
  source: string | null;
  boundAt: string | null;
}

export interface InviteMapPoint {
  address: string;
  displayAddress: string;
  x: number;
  y: number;
  level: 1 | 2;
  recent: boolean;
  activated: boolean;
  tier: number | null;
}

export interface InviteMapResponse {
  width: number;
  height: number;
  totalLit: number;
  coverage: number;
  litPoints: InviteMapPoint[];
}

export interface ClaimableResponse {
  pendingTotalTai: string;
  unlockedTai: string;
  lockedTai: string;
  inviteCount: number;
  source: 'sale-v2' | 'marketing';
  ruleVersion?: string;
  nextMilestone?: number | null;
  ratios?: {
    timeRatioBp: number;
    inviteRatioBp: number;
    taskSaveRatioBp: number;
    finalRatioBp: number;
  };
  taskSaveProgress?: {
    bindGroupDone?: boolean;
    signInDays?: number;
    sign7Done?: boolean;
    sign21Done?: boolean;
    onboardingDone?: boolean;
    governanceDone?: boolean;
    saveBasicDone?: boolean;
    saveAdvancedDone?: boolean;
  };
}

export interface SaleV2ClaimTaskRewardResponse {
  amount: string;
  nonce: string;
  deadline: number;
  signature: string;
  inviteCount: number;
  ruleVersion?: string;
  breakdown?: {
    totalPending?: string;
    unlockedNow?: string;
    inflightSigned?: string;
    claimable?: string;
    finalRatioBp?: number;
  };
}

export interface InviteClaimResponse {
  amount: string;
  nonce: string;
  deadline: number;
  signature: string;
  baseAmount?: string;
  inviteCount?: number;
  multiplierBp?: number;
  lockedCount?: number;
  ruleVersion?: string;
}

export interface MarketingClaimResponse {
  success?: boolean;
  data?: {
    amount?: string;
    nonce?: string;
    deadline?: number;
    signature?: string;
  };
  amount?: string;
  nonce?: string;
  deadline?: number;
  signature?: string;
}

export interface MissionProgressResponse {
  ruleVersion?: string;
  walletAddress?: string;
  taskSaveRatioBp: number;
  source: 'missions' | 'claimable';
  progress: {
    bindGroupDone: boolean;
    signInDays: number;
    sign7Done: boolean;
    sign21Done: boolean;
    onboardingDone: boolean;
    governanceDone: boolean;
    fixedStakeActive: boolean;
    fixedStakeMatured: boolean;
  };
}

export interface RecentPurchase {
  address: string;
  tier: number;
  timestamp?: string;
}

export interface PurchaseCountsResponse {
  counts: {
    tier1: number;
    tier2: number;
    tier3: number;
  };
  limits: {
    tier1: number;
    tier2: number;
    tier3: number;
  };
  remaining: {
    tier1: number;
    tier2: number;
    tier3: number;
  };
}

export interface ReconcilePurchasesResponse {
  ok: boolean;
  walletAddress: string;
  sync: {
    synced: number;
    errors: string[];
  };
  counts: {
    tier1: number;
    tier2: number;
    tier3: number;
  };
  limits: {
    tier1: number;
    tier2: number;
    tier3: number;
  };
  remaining: {
    tier1: number;
    tier2: number;
    tier3: number;
  };
}

export interface DepositTxResponse {
  to: string;
  payload: string;
  tonAmount: string;
  predictedGoalId?: string;
}

export interface DepositGoalChainItem {
  id: string;
  target_usd_nano: string;
  deposited_tai_nano: string;
  created_at: string;
  claimed: boolean;
}

export interface DepositGoalsResponse {
  wallet_address: string;
  active_count: string;
  next_goal_id: string;
  scanned: number;
  max_scan: number;
  include_claimed?: boolean;
  ladder?: {
    fixed_targets_usd: number[];
    completed_targets_usd: number[];
    next_required_usd: number | null;
    custom_unlocked: boolean;
  };
  goals: DepositGoalChainItem[];
}

export interface DepositCheckinResponse {
  wallet_address: string;
  today: string;
  checked_in_today: boolean;
  already_checked_in_today?: boolean;
  can_checkin_today: boolean;
  streak_days: number;
  total_days: number;
  last_checkin_date: string | null;
  reason?: string | null;
  observed_total_deposited_nano?: string | null;
  delta_nano?: string | null;
  has_new_onchain_deposit_today?: boolean | null;
  created_goals_today?: number | null;
  source?: string | null;
}

export interface InviteCodeLookupResponse {
  valid: boolean;
  code: string;
  inviterAddress?: string;
}

export interface PortfolioResponse {
  walletBalance: string;
  totalPending: string;
  totalStaked: string;
  totalClaimed?: string;
  claimableCount?: number;
  lockedCount?: number;
}

export interface GrowthStartBindResponse {
  success: boolean;
  walletAddress: string;
  bindToken: string;
  expiresInSec: number;
  minMembers: number;
  deepLink: string;
  helpUrl?: string;
}

export interface GrowthTelegramGroup {
  id: string;
  chat_id: number;
  chat_username?: string | null;
  chat_title?: string | null;
  owner_wallet: string;
  member_count: number;
  active_count_24h: number;
  group_level: 'seed' | 'growth' | 'active' | 'elite' | 'legend';
  reward_multiplier: number;
  verified_at?: string | null;
  last_sync_at?: string | null;
}

export interface GrowthTask {
  id: string;
  task_key: string;
  task_type: 'daily' | 'growth' | 'viral' | 'campaign';
  title_zh: string;
  title_en: string;
  reward_tai: string;
  cooldown_hours: number | null;
  requirements: Record<string, unknown>;
  is_active: boolean;
}

export interface GrowthTaskProgress {
  taskKey: string;
  done: boolean;
  progress: number;
  target: number | null;
}

export interface GrowthEarningsSummary {
  totalTai: string;
  thisWeekTai: string;
  claimableTai: string;
  claimedTai: string;
}

export interface GrowthEarningItem {
  id: string;
  wallet_address: string;
  group_id?: string | null;
  source_type: string;
  source_id?: string | null;
  amount_tai: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
  claimed: boolean;
  claimed_at?: string | null;
  created_at: string;
}

export interface GrowthEarningsListResponse {
  earnings: GrowthEarningItem[];
  page: number;
  limit: number;
  total: number;
}

export interface GrowthClaimResponse {
  success: boolean;
  walletAddress: string;
  claimedTai: string;
  claimBatchId: string;
  mode: 'ledger_only';
  withdraw: {
    status: string;
    gas: string;
  };
}

function normalizeBase(base: string): string {
  return base.replace(/\/+$/, '');
}

function buildUrl(base: string, path: string): string {
  const cleanBase = normalizeBase(base);
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (cleanBase.endsWith('/api') && cleanPath.startsWith('/api/')) {
    return `${cleanBase}${cleanPath.slice(4)}`;
  }

  return `${cleanBase}${cleanPath}`;
}

function getBaseCandidates(): string[] {
  const base = normalizeBase(API_BASE);
  const withApi = base.endsWith('/api') ? base : `${base}/api`;
  const withoutApi = base.endsWith('/api') ? base.slice(0, -4) : base;
  return Array.from(new Set([base, withApi, withoutApi]));
}

async function tryFetch(url: string, init: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const timeout = window.setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

async function requestJson<T>(paths: string | string[], init?: RequestInit): Promise<T> {
  const candidates = Array.isArray(paths) ? paths : [paths];
  const bases = getBaseCandidates();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };

  const initData = telegramInitData();
  if (initData) headers['X-Telegram-Init-Data'] = initData;

  let lastError: Error | null = null;

  for (const path of candidates) {
    for (const base of bases) {
      const url = buildUrl(base, path);
      for (let i = 0; i <= RETRIES; i += 1) {
        try {
          const res = await tryFetch(url, { ...init, headers });
          if (res.ok) return (await res.json()) as T;
          if (res.status >= 500 && i < RETRIES) continue;
          let errorDetail = '';
          try {
            const text = await res.text();
            if (text) {
              try {
                const parsed = JSON.parse(text) as AnyObject;
                const reason = parsed.error || parsed.message || parsed.detail;
                errorDetail = reason ? String(reason) : text;
              } catch {
                errorDetail = text;
              }
            }
          } catch {
            // ignore parse failure
          }
          lastError = new Error(errorDetail ? `${errorDetail}` : `API ${res.status} ${url}`);
          break;
        } catch (error) {
          lastError = error as Error;
          if (i >= RETRIES) break;
        }
      }
    }
  }

  throw lastError || new Error('API request failed');
}

async function requestWithFallback<T>(attempts: Array<() => Promise<T>>): Promise<T> {
  let lastError: Error | null = null;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error as Error;
    }
  }
  throw lastError || new Error('API request failed');
}

function toObject(value: unknown): AnyObject {
  return value && typeof value === 'object' ? (value as AnyObject) : {};
}

function toNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function nanoToTai(value: unknown): string {
  try {
    const nano = BigInt(String(value ?? 0));
    const whole = nano / NANO_PER_TAI;
    const fraction = nano % NANO_PER_TAI;
    if (fraction === 0n) return whole.toString();
    const fractionText = fraction.toString().padStart(9, '0').replace(/0+$/, '').slice(0, 4);
    return fractionText ? `${whole}.${fractionText}` : whole.toString();
  } catch {
    return '0';
  }
}

function extractInviteCodeFromLink(link: string): string {
  const text = String(link || '').trim();
  if (!text) return '';
  const refMatch =
    text.match(/[?&]ref=([A-Za-z0-9_-]+)/i)?.[1] ||
    text.match(/[?&]startapp=ref_([A-Za-z0-9_-]+)/i)?.[1] ||
    text.match(/[?&]start=ref_([A-Za-z0-9_-]+)/i)?.[1];
  return (refMatch || '').toUpperCase();
}

function buildMiniInviteLink(code: string): string {
  const ref = String(code || '').trim().toUpperCase();
  return ref ? `${MINI_APP_INVITE_BASE}?ref=${ref}` : MINI_APP_INVITE_BASE;
}

function normalizeInviteStatsResponse(rawResponse: unknown, walletAddress: string): InviteStatsResponse {
  const root = toObject(rawResponse);
  const raw = toObject(root.stats || root.data || root);

  const inviteCode = String(raw.inviteCode || raw.code || '').toUpperCase();
  const inviteCount = toNumber(raw.inviteCount ?? raw.totalInvites, 0);
  const activatedInvites = toNumber(raw.activatedInvites, 0);

  const totalInviteRewardsTai =
    raw.totalInviteRewardsTai != null
      ? String(raw.totalInviteRewardsTai)
      : nanoToTai(raw.totalEarned ?? raw.total_rewards ?? raw.totalRewards ?? 0);

  const fallbackCode = inviteCode || walletAddress.slice(0, 8).toUpperCase();
  const rawInviteLink = String(raw.inviteLink || '').trim();
  const inviteCodeFromLink = extractInviteCodeFromLink(rawInviteLink);
  const inviteLink = inviteCodeFromLink
    ? buildMiniInviteLink(inviteCodeFromLink)
    : rawInviteLink || buildMiniInviteLink(fallbackCode);

  return {
    inviteCode,
    inviteLink,
    inviteCount,
    activatedInvites,
    totalInviteRewardsTai,
    rebateTier: raw.rebateTier ? String(raw.rebateTier) : undefined,
    multiplierBp: raw.multiplierBp != null ? toNumber(raw.multiplierBp, 0) : undefined,
  };
}

function normalizeInviteLeaderboardResponse(rawResponse: unknown): InviteLeaderboardEntry[] {
  const root = toObject(rawResponse);
  const rows = Array.isArray(root.leaderboard)
    ? root.leaderboard
    : Array.isArray(root.data)
      ? root.data
      : Array.isArray(root)
        ? root
        : [];

  return rows.map((row: unknown, index: number) => {
    const item = toObject(row);
    const rank = toNumber(item.rank, index + 1);
    const address = String(item.fullAddress || item.address || item.inviterAddress || item.owner_address || 'Unknown');
    const inviteCount = toNumber(item.inviteCount ?? item.invited_count ?? item.invites, 0);

    const totalRewardsTai =
      item.totalRewardsTai != null
        ? String(item.totalRewardsTai)
        : nanoToTai(item.totalRewards ?? item.total_rewards ?? item.earned ?? 0);

    return { rank, address, inviteCount, totalRewardsTai };
  });
}

function shortAddress(address: string, left = 6, right = 4): string {
  const text = String(address || '').trim();
  if (!text) return '';
  if (text.length <= left + right) return text;
  return `${text.slice(0, left)}...${text.slice(-right)}`;
}

function normalizeInviteTeamMember(rawMember: unknown, level: 1 | 2): InviteTeamMember {
  const item = toObject(rawMember);
  const address = String(item.address || item.invitee_address || item.inviteeAddress || '');
  const rewardAmountNano = String(item.rewardAmountNano ?? item.reward_amount ?? item.rewardAmount ?? 0);
  const rewardTai = item.rewardTai != null ? String(item.rewardTai) : nanoToTai(rewardAmountNano);
  const statusRaw = String(item.status || '').toLowerCase();
  const status: 'activated' | 'pending' =
    statusRaw === 'activated' || Boolean(item.hasPurchased || item.purchase_completed) ? 'activated' : 'pending';
  const tierValue = item.tier ?? item.first_purchase_tier;
  const tier = tierValue != null ? toNumber(tierValue, 0) || null : null;

  return {
    level,
    address,
    displayAddress: String(item.displayAddress || item.addressMasked || shortAddress(address)),
    inviterAddress: level === 2 ? String(item.inviterAddress || item.inviter_address || '') || undefined : undefined,
    inviterDisplayAddress:
      level === 2
        ? String(item.inviterDisplayAddress || item.inviter_address_masked || shortAddress(String(item.inviterAddress || item.inviter_address || ''))) ||
          undefined
        : undefined,
    status,
    tier,
    rewardAmountNano,
    rewardTai,
    rewardClaimed: Boolean(item.rewardClaimed ?? item.reward_claimed),
    createdAt: item.createdAt || item.joinedAt || item.created_at || null,
    subInviteesCount: toNumber(item.subInviteesCount ?? item.childrenCount, 0),
  };
}

function normalizeInviteTeamResponse(rawResponse: unknown): InviteTeamResponse {
  const root = toObject(rawResponse);

  // Legacy shape fallback: /invite/invitees/:address
  if (Array.isArray(root.invitees)) {
    const directInvitees = root.invitees.map((item: unknown) => normalizeInviteTeamMember(item, 1));
    const directCount = directInvitees.length;
    const activatedDirectCount = directInvitees.filter((item) => item.status === 'activated').length;
    const totalRewardsNano = directInvitees.reduce((sum, item) => {
      try {
        return sum + BigInt(item.rewardAmountNano || '0');
      } catch {
        return sum;
      }
    }, 0n);
    return {
      depth: 1,
      directInvitees,
      indirectInvitees: [],
      stats: {
        directCount,
        indirectCount: 0,
        activatedDirectCount,
        activatedIndirectCount: 0,
        totalRewardsNano: totalRewardsNano.toString(),
        totalRewardsTai: nanoToTai(totalRewardsNano.toString()),
      },
    };
  }

  const directInvitees = Array.isArray(root.directInvitees)
    ? root.directInvitees.map((item: unknown) => normalizeInviteTeamMember(item, 1))
    : [];
  const indirectInvitees = Array.isArray(root.indirectInvitees)
    ? root.indirectInvitees.map((item: unknown) => normalizeInviteTeamMember(item, 2))
    : [];

  const statsRaw = toObject(root.stats);
  const totalRewardsNano =
    statsRaw.totalRewardsNano != null
      ? String(statsRaw.totalRewardsNano)
      : [...directInvitees, ...indirectInvitees].reduce((sum, item) => {
          try {
            return sum + BigInt(item.rewardAmountNano || '0');
          } catch {
            return sum;
          }
        }, 0n).toString();

  return {
    depth: toNumber(root.depth, 2) <= 1 ? 1 : 2,
    directInvitees,
    indirectInvitees,
    stats: {
      directCount: toNumber(statsRaw.directCount, directInvitees.length),
      indirectCount: toNumber(statsRaw.indirectCount, indirectInvitees.length),
      activatedDirectCount: toNumber(
        statsRaw.activatedDirectCount,
        directInvitees.filter((item) => item.status === 'activated').length
      ),
      activatedIndirectCount: toNumber(
        statsRaw.activatedIndirectCount,
        indirectInvitees.filter((item) => item.status === 'activated').length
      ),
      totalRewardsNano,
      totalRewardsTai: statsRaw.totalRewardsTai != null ? String(statsRaw.totalRewardsTai) : nanoToTai(totalRewardsNano),
    },
  };
}

function normalizeInviteSourceResponse(rawResponse: unknown, walletAddress: string): InviteSourceResponse {
  const root = toObject(rawResponse);
  const inviterRaw = root.inviter ? toObject(root.inviter) : null;
  const address = inviterRaw ? String(inviterRaw.address || inviterRaw.inviterAddress || '') : '';
  return {
    walletAddress: String(root.walletAddress || walletAddress || ''),
    inviter: inviterRaw && address
      ? {
          address,
          displayAddress: String(inviterRaw.displayAddress || shortAddress(address)),
          inviteCode: inviterRaw.inviteCode != null ? String(inviterRaw.inviteCode) : null,
          teamSize: toNumber(inviterRaw.teamSize, 0),
          totalRewardsNano: String(inviterRaw.totalRewardsNano ?? '0'),
          totalRewardsTai: inviterRaw.totalRewardsTai != null ? String(inviterRaw.totalRewardsTai) : nanoToTai(inviterRaw.totalRewardsNano ?? '0'),
        }
      : null,
    source: root.source != null ? String(root.source) : null,
    boundAt: root.boundAt != null ? String(root.boundAt) : null,
  };
}

function normalizeInviteMapResponse(rawResponse: unknown): InviteMapResponse {
  const root = toObject(rawResponse);
  const width = Math.max(20, toNumber(root.width, 58));
  const height = Math.max(10, toNumber(root.height, 26));
  const rows = Array.isArray(root.litPoints) ? root.litPoints : [];
  const litPoints = rows.map((row: unknown): InviteMapPoint => {
    const item = toObject(row);
    const address = String(item.address || '');
    return {
      address,
      displayAddress: String(item.displayAddress || shortAddress(address)),
      x: toNumber(item.x, 0),
      y: toNumber(item.y, 0),
      level: toNumber(item.level, 1) === 2 ? 2 : 1,
      recent: Boolean(item.recent),
      activated: Boolean(item.activated ?? item.status === 'activated'),
      tier: item.tier != null ? toNumber(item.tier, 0) || null : null,
    };
  });

  const coverage = toNumber(root.coverage, 0);
  return {
    width,
    height,
    totalLit: toNumber(root.totalLit, litPoints.length),
    coverage,
    litPoints,
  };
}

function normalizeClaimableResponse(rawResponse: unknown): ClaimableResponse {
  const root = toObject(rawResponse);
  const raw = toObject(root.data || root);

  if (raw.user) {
    const user = toObject(raw.user);
    return {
      pendingTotalTai: nanoToTai(user.pending_reward ?? 0),
      unlockedTai: '0',
      lockedTai: '0',
      inviteCount: 0,
      source: 'marketing',
    };
  }

  const ratiosRaw = toObject(raw.ratios);
  const taskSaveRaw = toObject(raw.taskSaveProgress);

  return {
    pendingTotalTai:
      raw.pendingTotalTai != null
        ? String(raw.pendingTotalTai)
        : nanoToTai(raw.totalPending ?? raw.totalAmount ?? 0),
    unlockedTai: nanoToTai(raw.unlocked ?? 0),
    lockedTai: nanoToTai(raw.locked ?? 0),
    inviteCount: toNumber(raw.inviteCount, 0),
    source: 'sale-v2',
    ruleVersion: raw.ruleVersion ? String(raw.ruleVersion) : undefined,
    nextMilestone: raw.nextMilestone != null ? toNumber(raw.nextMilestone, 0) : undefined,
    ratios: Object.keys(ratiosRaw).length
      ? {
          timeRatioBp: toNumber(ratiosRaw.timeRatioBp, 0),
          inviteRatioBp: toNumber(ratiosRaw.inviteRatioBp, 0),
          taskSaveRatioBp: toNumber(ratiosRaw.taskSaveRatioBp, 0),
          finalRatioBp: toNumber(ratiosRaw.finalRatioBp, 0),
        }
      : undefined,
    taskSaveProgress: Object.keys(taskSaveRaw).length
      ? {
          bindGroupDone: Boolean(taskSaveRaw.bindGroupDone),
          signInDays: toNumber(taskSaveRaw.signInDays, 0),
          sign7Done: Boolean(taskSaveRaw.sign7Done),
          sign21Done: Boolean(taskSaveRaw.sign21Done),
          onboardingDone: Boolean(taskSaveRaw.onboardingDone),
          governanceDone: Boolean(taskSaveRaw.governanceDone),
          saveBasicDone: Boolean(taskSaveRaw.saveBasicDone),
          saveAdvancedDone: Boolean(taskSaveRaw.saveAdvancedDone),
        }
      : undefined,
  };
}

function normalizeMissionProgressResponse(rawResponse: unknown): MissionProgressResponse {
  const root = toObject(rawResponse);
  const raw = toObject(root.data || root);
  const progressRaw = toObject(raw.progress);

  return {
    ruleVersion: raw.ruleVersion ? String(raw.ruleVersion) : undefined,
    walletAddress: raw.walletAddress ? String(raw.walletAddress) : undefined,
    taskSaveRatioBp: toNumber(raw.taskSaveRatioBp, 0),
    source: 'missions',
    progress: {
      bindGroupDone: Boolean(progressRaw.bind_group_done ?? progressRaw.bindGroupDone),
      signInDays: toNumber(progressRaw.sign_in_days ?? progressRaw.signInDays, 0),
      sign7Done: Boolean(progressRaw.sign7_done ?? progressRaw.sign7Done),
      sign21Done: Boolean(progressRaw.sign21_done ?? progressRaw.sign21Done),
      onboardingDone: Boolean(progressRaw.onboarding_done ?? progressRaw.onboardingDone),
      governanceDone: Boolean(progressRaw.governance_done ?? progressRaw.governanceDone),
      fixedStakeActive: Boolean(progressRaw.save_basic_done ?? progressRaw.saveBasicDone),
      fixedStakeMatured: Boolean(progressRaw.save_advanced_done ?? progressRaw.saveAdvancedDone),
    },
  };
}

function missionProgressFromClaimable(claimable: ClaimableResponse): MissionProgressResponse {
  const task = claimable.taskSaveProgress;
  return {
    ruleVersion: claimable.ruleVersion,
    walletAddress: undefined,
    taskSaveRatioBp: toNumber(claimable.ratios?.taskSaveRatioBp, 0),
    source: 'claimable',
    progress: {
      bindGroupDone: Boolean(task?.bindGroupDone),
      signInDays: toNumber(task?.signInDays, 0),
      sign7Done: Boolean(task?.sign7Done),
      sign21Done: Boolean(task?.sign21Done),
      onboardingDone: Boolean(task?.onboardingDone),
      governanceDone: Boolean(task?.governanceDone),
      fixedStakeActive: Boolean(task?.saveBasicDone),
      fixedStakeMatured: Boolean(task?.saveAdvancedDone),
    },
  };
}

function normalizeRecentPurchasesResponse(rawResponse: unknown): RecentPurchase[] {
  const root = toObject(rawResponse);
  const rows = Array.isArray(root.purchases)
    ? root.purchases
    : Array.isArray(root.data)
      ? root.data
      : Array.isArray(root)
        ? root
        : [];

  return rows.map((row: unknown) => {
    const item = toObject(row);
    return {
      address: String(item.address || item.wallet_address || item.invitee_address || 'Unknown'),
      tier: toNumber(item.tier ?? item.first_purchase_tier, 0),
      timestamp: item.timestamp || item.created_at,
    };
  });
}

function normalizePortfolioResponse(rawResponse: unknown): PortfolioResponse {
  const root = toObject(rawResponse);
  const raw = toObject(root.data || root);
  return {
    walletBalance: String(raw.walletBalance ?? '0'),
    totalPending: String(raw.totalPending ?? '0'),
    totalStaked: String(raw.totalStaked ?? '0'),
    totalClaimed: String(raw.totalClaimed ?? '0'),
    claimableCount: toNumber(raw.claimableCount, 0),
    lockedCount: toNumber(raw.lockedCount, 0),
  };
}

async function ensureReferralCode(walletAddress: string, existingCode: string): Promise<string> {
  if (existingCode) return existingCode;
  try {
    const result = await requestJson<any>('/api/referral/code', {
      method: 'POST',
      body: JSON.stringify({ wallet_address: walletAddress }),
    });
    const code = String(result?.data?.code || '').toUpperCase();
    return code || existingCode;
  } catch {
    return existingCode;
  }
}

export const api = {
  getPortfolio: (address: string) =>
    requestWithFallback<PortfolioResponse>([
      () => requestJson<any>(`/api/users/${address}/portfolio`).then((data) => normalizePortfolioResponse(data)),
      () => requestJson<any>(`/api/assets/overview/${address}`).then((data) => normalizePortfolioResponse(data)),
    ]),
  getInviteStats: (address: string) =>
    requestWithFallback<InviteStatsResponse>([
      () =>
        requestJson<any>([`/api/sale-v2/invite/stats/${address}`, `/sale-v2/invite/stats/${address}`]).then((data) =>
          normalizeInviteStatsResponse(data, address)
        ),
      () =>
        requestJson<any>(`/api/referral/stats/${address}`).then(async (data) => {
          const normalized = normalizeInviteStatsResponse(data, address);
          const code = await ensureReferralCode(address, normalized.inviteCode);
          const inviteLink = code ? buildMiniInviteLink(code) : normalized.inviteLink;
          return { ...normalized, inviteCode: code, inviteLink };
        }),
    ]),
  getInviteClaimable: (address: string) =>
    requestWithFallback<ClaimableResponse>([
      () =>
        requestJson<any>([`/api/sale-v2/invite/claimable/${address}`, `/sale-v2/invite/claimable/${address}`]).then((data) =>
          normalizeClaimableResponse(data)
        ),
      () => requestJson<any>(`/api/marketing/user/${address}`).then((data) => normalizeClaimableResponse(data)),
    ]),
  getInviteLeaderboard: () =>
    requestWithFallback<InviteLeaderboardEntry[]>([
      () => requestJson<any>(['/api/sale-v2/invite/leaderboard', '/sale-v2/invite/leaderboard']).then(normalizeInviteLeaderboardResponse),
      () => requestJson<any>('/api/referral/leaderboard').then(normalizeInviteLeaderboardResponse),
    ]),
  getInviteTeam: (address: string, depth: 1 | 2 = 2) =>
    requestWithFallback<InviteTeamResponse>([
      () =>
        requestJson<any>([
          `/api/sale-v2/invite/team/${address}?depth=${depth}`,
          `/sale-v2/invite/team/${address}?depth=${depth}`,
        ]).then((data) => normalizeInviteTeamResponse(data)),
      () =>
        requestJson<any>([
          `/api/sale-v2/invite/invitees/${address}`,
          `/sale-v2/invite/invitees/${address}`,
        ]).then((data) => normalizeInviteTeamResponse(data)),
    ]),
  getInviteSource: (address: string) =>
    requestWithFallback<InviteSourceResponse>([
      () =>
        requestJson<any>([`/api/sale-v2/invite/source/${address}`, `/sale-v2/invite/source/${address}`]).then((data) =>
          normalizeInviteSourceResponse(data, address)
        ),
      async () =>
        ({
          walletAddress: address,
          inviter: null,
          source: null,
          boundAt: null,
        } as InviteSourceResponse),
    ]),
  getInviteMap: (address: string) =>
    requestWithFallback<InviteMapResponse>([
      () =>
        requestJson<any>([`/api/sale-v2/invite/map/${address}`, `/sale-v2/invite/map/${address}`]).then((data) =>
          normalizeInviteMapResponse(data)
        ),
      () =>
        api.getInviteTeam(address, 2).then((team) => ({
          width: 58,
          height: 26,
          totalLit: team.stats.directCount + team.stats.indirectCount,
          coverage: 0,
          litPoints: [],
        })),
    ]),
  getRecentPurchases: async () => {
    try {
      const data = await requestJson<any>(['/api/sale-v2/recent-purchases', '/sale-v2/recent-purchases']);
      return normalizeRecentPurchasesResponse(data);
    } catch {
      return [];
    }
  },
  getPurchaseCounts: (address: string) =>
    requestJson<PurchaseCountsResponse>([`/api/sale-v2/purchase-counts/${address}`, `/sale-v2/purchase-counts/${address}`]),
  getClaimable: (address: string) =>
    requestWithFallback<ClaimableResponse>([
      () => requestJson<any>([`/api/sale-v2/claimable/${address}`, `/sale-v2/claimable/${address}`]).then((data) => normalizeClaimableResponse(data)),
      () => requestJson<any>(`/api/marketing/user/${address}`).then((data) => normalizeClaimableResponse(data)),
    ]),
  getSaleRules: () =>
    requestJson<any>(['/api/sale-v2/rules/active', '/sale-v2/rules/active']),
  getMissionProgress: (address: string) =>
    requestWithFallback<MissionProgressResponse>([
      () =>
        requestJson<any>([`/api/sale-v2/missions/progress/${address}`, `/sale-v2/missions/progress/${address}`]).then((data) =>
          normalizeMissionProgressResponse(data)
        ),
      () =>
        requestJson<any>([`/api/sale-v2/claimable/${address}`, `/sale-v2/claimable/${address}`]).then((data) =>
          missionProgressFromClaimable(normalizeClaimableResponse(data))
        ),
    ]),
  reportMissionProgress: (
    body: {
      walletAddress: string;
      missionCode: string;
      completed?: boolean;
      progressValue?: number;
      periodKey?: string;
      eventTime?: string;
      evidence?: Record<string, unknown>;
    },
    tonProofHeader?: string
  ) =>
    requestJson<any>(['/api/sale-v2/missions/report', '/sale-v2/missions/report'], {
      method: 'POST',
      headers: tonProofHeader ? { Authorization: tonProofHeader } : undefined,
      body: JSON.stringify(body),
    }),
  getTonBalance: async (address: string): Promise<number> => {
    const endpoints = ['https://toncenter.com/api/v2', 'https://testnet.toncenter.com/api/v2'];
    for (const endpoint of endpoints) {
      try {
        const res = await tryFetch(`${endpoint}/getAddressBalance?address=${encodeURIComponent(address)}`, {
          method: 'GET',
        });
        if (!res.ok) continue;
        const json = (await res.json()) as AnyObject;
        const nano = BigInt(String(json.result ?? 0));
        return Number(nano) / 1_000_000_000;
      } catch {
        // try next endpoint
      }
    }
    return 0;
  },
  createTask: (body: { walletAddress: string; tier: 1 | 2 | 3; inviteCode?: string }) =>
    requestWithFallback<any>([
      () => requestJson<any>(['/api/sale-v2/tasks/create', '/sale-v2/tasks/create'], { method: 'POST', body: JSON.stringify(body) }),
      () =>
        requestJson<any>('/api/marketing/notify-purchase', {
          method: 'POST',
          body: JSON.stringify({
            wallet_address: body.walletAddress,
            type: body.tier === 1 ? 'TIER1' : body.tier === 2 ? 'TIER2' : 'TIER3',
          }),
        }),
    ]),
  bindInvite: (body: { walletAddress: string; inviteCode: string }, tonProofHeader?: string) => {
    if (tonProofHeader) {
      // TonProof path is authoritative for sale-v2; do not fallback to legacy referral bind.
      return requestJson<any>(['/api/sale-v2/invite/bind', '/sale-v2/invite/bind'], {
        method: 'POST',
        headers: { Authorization: tonProofHeader },
        body: JSON.stringify(body),
      });
    }
    return requestWithFallback<any>([
      () =>
        requestJson<any>(['/api/sale-v2/invite/bind', '/sale-v2/invite/bind'], {
          method: 'POST',
          body: JSON.stringify(body),
        }),
      () =>
        requestJson<any>('/api/referral/bind', {
          method: 'POST',
          body: JSON.stringify({ wallet_address: body.walletAddress, referral_code: body.inviteCode }),
        }),
    ]);
  },
  reconcilePurchases: (body: { walletAddress: string }, tonProofHeader: string) =>
    requestJson<ReconcilePurchasesResponse>(['/api/sale-v2/purchases/reconcile', '/sale-v2/purchases/reconcile'], {
      method: 'POST',
      headers: { Authorization: tonProofHeader },
      body: JSON.stringify(body),
    }),
  claimInvite: (body: { walletAddress: string }, tonProofHeader?: string) =>
    requestJson<InviteClaimResponse>(['/api/sale-v2/invite/claim', '/sale-v2/invite/claim'], {
      method: 'POST',
      headers: tonProofHeader ? { Authorization: tonProofHeader } : undefined,
      body: JSON.stringify(body),
    }),
  claimMarketing: (body: { wallet_address: string }, tonProofHeader?: string) =>
    requestJson<MarketingClaimResponse>(['/api/marketing/claim', '/marketing/claim'], {
      method: 'POST',
      headers: tonProofHeader ? { Authorization: tonProofHeader } : undefined,
      body: JSON.stringify(body),
    }),
  claimSaleV2TaskReward: (body: { walletAddress: string }, tonProofHeader: string) =>
    requestJson<SaleV2ClaimTaskRewardResponse>(['/api/sale-v2/claim-task-reward', '/sale-v2/claim-task-reward'], {
      method: 'POST',
      headers: { Authorization: tonProofHeader },
      body: JSON.stringify(body),
    }),
  lookupInviteCode: async (code: string) => {
    const data = await requestJson<any>([`/api/sale-v2/invite/code/${encodeURIComponent(code)}`, `/sale-v2/invite/code/${encodeURIComponent(code)}`]);
    return {
      valid: true,
      code: String(data?.code || code).toUpperCase(),
      inviterAddress: data?.inviterAddress ? String(data.inviterAddress) : undefined,
    } as InviteCodeLookupResponse;
  },
  getPrice: () => requestJson<any>(['/price', '/api/price']),
  buildDepositCreateTx: (body: { wallet_address: string; target_usd_nano: string; amount_nano: string }) =>
    requestJson<DepositTxResponse>(['/api/deposit/tx/create', '/deposit/tx/create'], {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  buildDepositTopupTx: (body: { wallet_address: string; goal_id: string; amount_nano: string }) =>
    requestJson<DepositTxResponse>(['/api/deposit/tx/topup', '/deposit/tx/topup'], {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  buildDepositClaimTx: (body: { goal_id: string }) =>
    requestJson<DepositTxResponse>(['/api/deposit/tx/claim', '/deposit/tx/claim'], {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getDepositCheckin: (address: string) =>
    requestJson<DepositCheckinResponse>([`/api/deposit/checkin/${address}`, `/deposit/checkin/${address}`]),
  checkinDeposit: (body: {
    wallet_address: string;
    source?: 'create' | 'topup' | 'deposit';
    max_scan?: number;
  }) =>
    requestJson<DepositCheckinResponse>(['/api/deposit/checkin', '/deposit/checkin'], {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getDepositGoals: (address: string, options?: { includeClaimed?: boolean; maxScan?: number }) => {
    const params = new URLSearchParams();
    if (options?.includeClaimed) params.set('include_claimed', '1');
    if (options?.maxScan) params.set('max_scan', String(options.maxScan));
    const query = params.toString();
    const suffix = query ? `?${query}` : '';
    return requestJson<DepositGoalsResponse>([`/api/deposit/goals/${address}${suffix}`, `/deposit/goals/${address}${suffix}`]);
  },
  growthStartBind: (body: { walletAddress: string }, tonProofHeader: string) =>
    requestJson<GrowthStartBindResponse>(['/api/growth/groups/start-bind', '/growth/groups/start-bind'], {
      method: 'POST',
      headers: { Authorization: tonProofHeader },
      body: JSON.stringify(body),
    }),
  getGrowthGroups: (address: string) =>
    requestJson<{ groups: GrowthTelegramGroup[] }>([
      `/api/growth/groups/mine/${address}`,
      `/growth/groups/mine/${address}`,
    ]).then((res) => res?.groups || []),
  getGrowthTasks: () =>
    requestJson<{ tasks: GrowthTask[] }>(['/api/growth/tasks', '/growth/tasks']).then((res) => res?.tasks || []),
  getGrowthTaskProgress: (address: string) =>
    requestJson<{ progress: GrowthTaskProgress[] }>([
      `/api/growth/tasks/progress/${address}`,
      `/growth/tasks/progress/${address}`,
    ]).then((res) => res?.progress || []),
  getGrowthEarningsSummary: (address: string) =>
    requestJson<GrowthEarningsSummary>([
      `/api/growth/earnings/summary/${address}`,
      `/growth/earnings/summary/${address}`,
    ]),
  getGrowthEarnings: (address: string, page = 1, limit = 20) =>
    requestJson<GrowthEarningsListResponse>([
      `/api/growth/earnings/${address}?page=${page}&limit=${limit}`,
      `/growth/earnings/${address}?page=${page}&limit=${limit}`,
    ]),
  claimGrowthEarnings: (body: { walletAddress: string }, tonProofHeader: string) =>
    requestJson<GrowthClaimResponse>(['/api/growth/earnings/claim', '/growth/earnings/claim'], {
      method: 'POST',
      headers: { Authorization: tonProofHeader },
      body: JSON.stringify(body),
    }),
};
