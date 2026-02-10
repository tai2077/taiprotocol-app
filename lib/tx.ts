import { beginCell } from '@ton/core';

export function buildTextPayload(message: string): string {
  const textBytes = new TextEncoder().encode(message);
  const payload = new Uint8Array(4 + textBytes.length);
  payload.set(textBytes, 4);
  let binary = '';
  for (let i = 0; i < payload.length; i++) binary += String.fromCharCode(payload[i]);
  return btoa(binary);
}

export function buildJsonPayload(jsonData: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(jsonData));
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.trim().toLowerCase();
  if (!/^[0-9a-f]+$/.test(normalized) || normalized.length % 2 !== 0) {
    throw new Error('Invalid signature format');
  }
  const out = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    out[i / 2] = Number.parseInt(normalized.slice(i, i + 2), 16);
  }
  return out;
}

export function buildSaleV2ClaimPayload(data: {
  amount: string;
  nonce: string;
  deadline: number;
  signature: string;
}): string {
  const signatureBuilder = beginCell();
  for (const byte of hexToBytes(data.signature)) {
    signatureBuilder.storeUint(byte, 8);
  }
  const signatureCell = signatureBuilder.endCell();
  const body = beginCell()
    .storeUint(2016278333, 32) // ClaimTaskReward opcode
    .storeCoins(BigInt(data.amount))
    .storeUint(BigInt(data.nonce), 256)
    .storeUint(BigInt(data.deadline), 64)
    .storeRef(signatureCell)
    .endCell();
  return body.toBoc().toString('base64');
}
