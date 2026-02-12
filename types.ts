export interface UserStats {
  rank: number | null;
  tonBalance: number;
  taiBalance: number;
  lockedTai: number;
  pendingTai: number;
  points: number;
  wealthGoalUsd: number;
  onchainTai: number;
}

export interface DepositGoal {
  id: string;
  targetUsd: number;
  depositedTai: number;
  createdAt: number;
  claimed: boolean;
}

export interface LeaderboardEntry {
  user: string;
  value: number;
}
