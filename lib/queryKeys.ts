export const queryKeys = {
  price: ['price'] as const,
  claimable: (walletAddress: string) => ['claimable', walletAddress] as const,
  inviteStats: (walletAddress: string) => ['invite-stats', walletAddress] as const,
  inviteClaimable: (walletAddress: string) => ['invite-claimable', walletAddress] as const,
  inviteTeam: (walletAddress: string) => ['invite-team', walletAddress] as const,
  inviteSource: (walletAddress: string) => ['invite-source', walletAddress] as const,
  inviteMap: (walletAddress: string) => ['invite-map', walletAddress] as const,
  purchaseCounts: (walletAddress: string) => ['purchase-counts', walletAddress] as const,
  recentPurchases: ['recent-purchases'] as const,
  growthTasks: ['growth-tasks'] as const,
  growthProgress: (walletAddress: string) => ['growth-progress', walletAddress] as const,
  growthGroups: (walletAddress: string) => ['growth-groups', walletAddress] as const,
  growthEarnings: (walletAddress: string, page: number, limit: number) =>
    ['growth-earnings', walletAddress, page, limit] as const,
  growthEarningsSummary: (walletAddress: string) => ['growth-earnings-summary', walletAddress] as const,
};
