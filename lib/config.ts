const envApiBase = String(import.meta.env.VITE_API_BASE || '').trim();
const useDevProxy =
  import.meta.env.DEV && (!envApiBase || /^https?:\/\/api\.tai\.lat\/?$/i.test(envApiBase));

export const API_BASE = useDevProxy ? '' : envApiBase || 'https://api.tai.lat';

export const SALE_CONTRACT = import.meta.env.VITE_SALE_CONTRACT_ADDRESS || 'EQBzd6g1X2N712Kv9-guQb1sO4VsN9qG2tGtHimePHpTmkIu';
export const VESTING_CONTRACT = import.meta.env.VITE_VESTING_CONTRACT_ADDRESS || 'EQC_rE2HuzK3OvHd5qhxZdm0xzVCa0kOR64ggf50dioQCRpw';
export const MARKETING_VAULT = import.meta.env.VITE_MARKETING_VAULT_ADDRESS || 'EQCCqb7hWjt7MyFMP6hb0AmryMUyhCqd5WVa_2KJAjxA-n9f';
export const DEPOSIT_GOAL_VAULT = import.meta.env.VITE_DEPOSIT_GOAL_VAULT_ADDRESS || 'EQDOxdta3t28rrvXwAGM8sln9QAevNj8c66tmwXIxys0Wzzt';
export const TAI_TOKEN_ADDRESS = import.meta.env.VITE_TAI_TOKEN_ADDRESS || 'EQDrjcL2uTkVEj2tmH9wbf83ZrO5wFbgIOApyIVr223RcgpL';
export const STAKING_POOL_CONTRACT = import.meta.env.VITE_STAKING_POOL_ADDRESS || 'EQBG-U5Aiz_IoGt8Wlgzqn_ELeL6zoyUlhiONviLQX2oQLyu';
export const FIXED_STAKING_CONTRACT =
  import.meta.env.VITE_FIXED_STAKING_CONTRACT_ADDRESS || 'EQDAIPbwnvMcWsbrXcRVOT1EYFhkIoIcFXIfy2C07wXyIf9m';

export function telegramInitData(): string {
  return window.Telegram?.WebApp?.initData || '';
}

export function isTelegramInApp(): boolean {
  const initData = telegramInitData().trim();
  if (initData.length > 0) return true;

  const search = window.location.search || '';
  return /(?:^|[?&])tgWebAppData=/.test(search) || /(?:^|[?&])tgWebAppPlatform=/.test(search);
}
