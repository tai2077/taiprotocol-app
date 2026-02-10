import { API_BASE, telegramInitData } from './config';

const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 10000);
const RETRIES = 1;
const NANO_PER_TAI = 1_000_000_000n;

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
  goals: DepositGoalChainItem[];
}

export interface PortfolioResponse {
  walletBalance: string;
  totalPending: string;
  totalStaked: string;
  totalClaimed?: string;
  claimableCount?: number;
  lockedCount?: number;
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
  const inviteLink =
    String(raw.inviteLink || '').trim() || `https://t.me/taitoken_bot?startapp=ref_${fallbackCode}`;

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
          const inviteLink = code ? `https://t.me/taitoken_bot?startapp=ref_${code}` : normalized.inviteLink;
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
    requestJson<any>([`/api/sale-v2/missions/progress/${address}`, `/sale-v2/missions/progress/${address}`]),
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
  claimInvite: (body: { walletAddress: string }) =>
    requestJson<any>(['/api/sale-v2/invite/claim', '/sale-v2/invite/claim'], { method: 'POST', body: JSON.stringify(body) }),
  claimMarketing: (body: { wallet_address: string }) =>
    requestJson<any>(['/api/marketing/claim', '/marketing/claim'], { method: 'POST', body: JSON.stringify(body) }),
  claimSaleV2TaskReward: (body: { walletAddress: string }, tonProofHeader: string) =>
    requestJson<SaleV2ClaimTaskRewardResponse>(['/api/sale-v2/claim-task-reward', '/sale-v2/claim-task-reward'], {
      method: 'POST',
      headers: { Authorization: tonProofHeader },
      body: JSON.stringify(body),
    }),
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
  getDepositGoals: (address: string) =>
    requestJson<DepositGoalsResponse>([`/api/deposit/goals/${address}`, `/deposit/goals/${address}`]),
};
