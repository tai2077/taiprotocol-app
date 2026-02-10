import { Address } from '@ton/core';

export interface TonProofDomain {
  lengthBytes: number;
  value: string;
}

export interface TonProof {
  timestamp: number;
  domain: TonProofDomain;
  signature: string;
  payload: string;
  state_init?: string;
}

export interface TonProofPayload {
  address: string;
  proof: TonProof;
}

const TON_PROOF_CACHE_KEY = 'tai:ton_proof_cache';
const TON_PROOF_VALIDITY_MS = 4 * 60 * 1000;

type AnyWallet = {
  account?: { address?: string };
  connectItems?: {
    tonProof?: {
      name?: string;
      proof?: {
        timestamp?: number;
        domain?: { lengthBytes?: number; value?: string };
        signature?: string;
        payload?: string;
        state_init?: string;
      };
    };
  };
};

function normalizeAddress(address: string): string {
  try {
    return Address.parse(address).toString({ bounceable: false, urlSafe: true, testOnly: false });
  } catch {
    return address.trim().toLowerCase();
  }
}

function isProofFresh(proof: TonProofPayload): boolean {
  const tsMs = Number(proof.proof?.timestamp || 0) * 1000;
  if (!tsMs) return false;
  return Date.now() - tsMs < TON_PROOF_VALIDITY_MS;
}

function readCachedProof(expectedAddress: string): TonProofPayload | null {
  try {
    const raw = window.localStorage.getItem(TON_PROOF_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TonProofPayload;
    if (!parsed?.address || !parsed?.proof) return null;
    if (normalizeAddress(parsed.address) !== normalizeAddress(expectedAddress)) return null;
    if (!isProofFresh(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function cacheProof(payload: TonProofPayload): void {
  try {
    window.localStorage.setItem(TON_PROOF_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage failure
  }
}

export function generateTonProofConnectPayload(): string {
  const random = Math.random().toString(36).slice(2);
  return `tai-auth-${Date.now()}-${random}`;
}

export function setupTonProofConnectRequest(
  tonConnectUI: { setConnectRequestParameters: (value: any) => void },
  payload?: string
): void {
  tonConnectUI.setConnectRequestParameters({
    state: 'ready',
    value: {
      tonProof: payload || generateTonProofConnectPayload(),
    },
  });
}

export function clearTonProofConnectRequest(tonConnectUI: { setConnectRequestParameters: (value: any) => void }): void {
  tonConnectUI.setConnectRequestParameters(null);
}

export function extractTonProofFromWallet(wallet: unknown): TonProofPayload | null {
  const w = wallet as AnyWallet | null;
  if (!w?.account?.address) return null;

  const tonProof = w.connectItems?.tonProof;
  const proof = tonProof?.proof;
  if (!proof || tonProof?.name !== 'ton_proof') return null;
  if (!proof.signature || !proof.payload || !proof.timestamp || !proof.domain?.value) return null;

  return {
    address: w.account.address,
    proof: {
      timestamp: Number(proof.timestamp),
      domain: {
        lengthBytes: Number(proof.domain.lengthBytes || proof.domain.value.length || 0),
        value: String(proof.domain.value),
      },
      signature: String(proof.signature),
      payload: String(proof.payload),
      state_init: proof.state_init ? String(proof.state_init) : undefined,
    },
  };
}

export function getTonProofPayload(wallet: unknown, expectedAddress: string): TonProofPayload | null {
  const fromWallet = extractTonProofFromWallet(wallet);
  if (fromWallet) {
    const sameAddress = normalizeAddress(fromWallet.address) === normalizeAddress(expectedAddress);
    if (sameAddress && isProofFresh(fromWallet)) {
      cacheProof(fromWallet);
      return fromWallet;
    }
  }
  return readCachedProof(expectedAddress);
}

export function serializeTonProofHeader(payload: TonProofPayload): string {
  const encoded = btoa(
    JSON.stringify({
      address: payload.address,
      proof: payload.proof,
    })
  );
  return `TonProof ${encoded}`;
}
