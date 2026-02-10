export interface WalletState {
  connected: boolean;
  address: string | null;
}

export async function connectTonWallet(): Promise<WalletState> {
  return {
    connected: true,
    address: 'EQB7...TAI7',
  };
}

export async function disconnectTonWallet(): Promise<WalletState> {
  return {
    connected: false,
    address: null,
  };
}
