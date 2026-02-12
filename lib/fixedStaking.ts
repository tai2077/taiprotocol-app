import { Address, Cell, beginCell } from '@ton/core';
import { FIXED_STAKING_CONTRACT, TAI_TOKEN_ADDRESS } from './config';

const NANO_PER_TAI = 1_000_000_000n;
const TON_NETWORK = String(import.meta.env.VITE_TON_NETWORK || 'mainnet')
  .trim()
  .toLowerCase();
const RPC_ENDPOINT =
  TON_NETWORK === 'testnet'
    ? 'https://testnet.toncenter.com/api/v2/jsonRPC'
    : 'https://toncenter.com/api/v2/jsonRPC';
const TONCENTER_API_KEY = String(import.meta.env.VITE_TONCENTER_API_KEY || '').trim();

type RpcStackEntry = any;

export interface FixedStakingOverview {
  contractAddress: string;
  isStakeWindowOpen: boolean;
  timeUntilWindowCloseSec: number;
  startTimeSec: number;
  endTimeSec: number;
  currentRound: number;
  principalUnlockRound: number;
  rewardUnlockRound: number;
  allRoundsUnlocked: boolean;
  totalStakedTai: number;
  rewardsBalanceTai: number;
}

export interface FixedStakeUserState {
  hasStake: boolean;
  claimablePrincipalTai: number;
  claimableRewardTai: number;
  claimableTotalTai: number;
}

export interface FixedStakeTransferTx {
  to: string;
  payload: string;
  tonAmount: string;
  amountNano: string;
}

function parseTonNumber(value: unknown): bigint {
  const text = String(value ?? '0').trim().toLowerCase();
  if (!text) return 0n;
  if (text.startsWith('-0x')) return -BigInt(`0x${text.slice(3)}`);
  if (text.startsWith('0x')) return BigInt(text);
  return BigInt(text);
}

function parseNum(entry: RpcStackEntry): bigint {
  if (Array.isArray(entry)) {
    if (entry[0] === 'num') return parseTonNumber(entry[1]);
    return 0n;
  }
  if (entry && typeof entry === 'object' && entry['@type'] === 'tvm.stackEntryNumber') {
    return parseTonNumber(entry.number?.number ?? 0);
  }
  return 0n;
}

function parseBool(entry: RpcStackEntry): boolean {
  return parseNum(entry) !== 0n;
}

function nanoToTaiNumber(nano: bigint): number {
  return Number(nano) / 1_000_000_000;
}

function parseAddressFromStackCell(entry: RpcStackEntry): string | null {
  try {
    if (!Array.isArray(entry) || entry[0] !== 'cell') return null;
    const raw = entry[1];
    const bytes = raw?.bytes || raw?.cell || '';
    if (!bytes) return null;
    const cell = Cell.fromBase64(String(bytes));
    const address = cell.beginParse().loadAddress();
    return address ? address.toString({ bounceable: false, urlSafe: true, testOnly: false }) : null;
  } catch {
    return null;
  }
}

async function runGetMethod(address: string, method: string, stack: any[] = []): Promise<RpcStackEntry[]> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (TONCENTER_API_KEY) headers['X-API-Key'] = TONCENTER_API_KEY;

  const res = await fetch(RPC_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      id: '1',
      jsonrpc: '2.0',
      method: 'runGetMethod',
      params: { address, method, stack },
    }),
  });

  const data = (await res.json()) as any;
  if (!data?.ok) {
    throw new Error(String(data?.result || data?.error || data?.code || `runGetMethod failed: ${method}`));
  }
  if (!Array.isArray(data?.result?.stack)) {
    throw new Error(`Invalid runGetMethod response: ${method}`);
  }
  return data.result.stack as RpcStackEntry[];
}

function addressStackArg(address: string): any[] {
  const owner = Address.parse(address);
  const ownerBoc = beginCell().storeAddress(owner).endCell().toBoc().toString('base64');
  return [['tvm.Slice', ownerBoc]];
}

function hasStakeFromInfoEntry(entry: RpcStackEntry): boolean {
  if (!Array.isArray(entry)) return false;
  if (entry[0] !== 'list') return false;
  const listObj = entry[1];
  const elements = listObj?.elements;
  return Array.isArray(elements) && elements.length > 0;
}

function parseTaiToNano(input: string): bigint {
  const text = String(input || '').trim().replace(/,/g, '');
  if (!text) return 0n;
  if (!/^\d+(\.\d+)?$/.test(text)) return 0n;
  const [wholePart, fractionalPart = ''] = text.split('.');
  const whole = BigInt(wholePart || '0');
  const frac = BigInt((fractionalPart + '000000000').slice(0, 9));
  return whole * NANO_PER_TAI + frac;
}

async function getUserTaiJettonWallet(ownerAddress: string): Promise<string> {
  const stack = addressStackArg(ownerAddress);
  const result = await runGetMethod(TAI_TOKEN_ADDRESS, 'get_wallet_address', stack);
  const walletAddress = parseAddressFromStackCell(result[0]);
  if (!walletAddress) throw new Error('Failed to resolve TAI jetton wallet');
  return walletAddress;
}

export async function getFixedStakingOverview(): Promise<FixedStakingOverview> {
  const [infoStack, openStack, closeStack] = await Promise.all([
    runGetMethod(FIXED_STAKING_CONTRACT, 'get_info'),
    runGetMethod(FIXED_STAKING_CONTRACT, 'is_stake_window_open'),
    runGetMethod(FIXED_STAKING_CONTRACT, 'get_time_until_window_close'),
  ]);

  return {
    contractAddress: FIXED_STAKING_CONTRACT,
    isStakeWindowOpen: parseBool(openStack[0]),
    timeUntilWindowCloseSec: Math.max(0, Number(parseNum(closeStack[0]))),
    startTimeSec: Number(parseNum(infoStack[4])),
    endTimeSec: Number(parseNum(infoStack[5])),
    currentRound: Number(parseNum(infoStack[6])),
    principalUnlockRound: Number(parseNum(infoStack[7])),
    rewardUnlockRound: Number(parseNum(infoStack[8])),
    allRoundsUnlocked: parseBool(infoStack[9]),
    totalStakedTai: nanoToTaiNumber(parseNum(infoStack[10])),
    rewardsBalanceTai: nanoToTaiNumber(parseNum(infoStack[11])),
  };
}

export async function getFixedStakeUserState(userAddress: string): Promise<FixedStakeUserState> {
  const stack = addressStackArg(userAddress);
  const [stakeInfoStack, principalStack, rewardStack] = await Promise.all([
    runGetMethod(FIXED_STAKING_CONTRACT, 'get_stake_info', stack),
    runGetMethod(FIXED_STAKING_CONTRACT, 'get_user_claimable_principal', stack),
    runGetMethod(FIXED_STAKING_CONTRACT, 'get_user_claimable_reward', stack),
  ]);

  const principal = nanoToTaiNumber(parseNum(principalStack[0]));
  const reward = nanoToTaiNumber(parseNum(rewardStack[0]));
  return {
    hasStake: hasStakeFromInfoEntry(stakeInfoStack[0]),
    claimablePrincipalTai: principal,
    claimableRewardTai: reward,
    claimableTotalTai: principal + reward,
  };
}

export async function buildFixedStakeTransferTx(walletAddress: string, amountTaiInput: string): Promise<FixedStakeTransferTx> {
  const amountNano = parseTaiToNano(amountTaiInput);
  if (amountNano <= 0n) throw new Error('Amount must be greater than 0');

  const jettonWallet = await getUserTaiJettonWallet(walletAddress);
  const transferBody = beginCell()
    .storeUint(0x0f8a7ea5, 32)
    .storeUint(0, 64)
    .storeCoins(amountNano)
    .storeAddress(Address.parse(FIXED_STAKING_CONTRACT))
    .storeAddress(Address.parse(walletAddress))
    .storeBit(false)
    .storeCoins(50_000_000n)
    .storeBit(false)
    .endCell();

  return {
    to: jettonWallet,
    payload: transferBody.toBoc().toString('base64'),
    tonAmount: '150000000',
    amountNano: amountNano.toString(),
  };
}
