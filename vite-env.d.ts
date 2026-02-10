/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  readonly VITE_API_TIMEOUT_MS?: string;
  readonly VITE_SALE_CONTRACT_ADDRESS?: string;
  readonly VITE_VESTING_CONTRACT_ADDRESS?: string;
  readonly VITE_MARKETING_VAULT_ADDRESS?: string;
  readonly VITE_DEPOSIT_GOAL_VAULT_ADDRESS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
