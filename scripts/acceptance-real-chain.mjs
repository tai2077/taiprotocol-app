#!/usr/bin/env node

import { Address } from '@ton/core';

const API_BASE = process.env.API_BASE || 'https://api.tai.lat';
const INVITER_INPUT = process.env.INVITER_WALLET || '';
const INVITEE_INPUT = process.env.INVITEE_WALLET || '';

const timeoutMs = 15000;

function failFast(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function normalizeAddress(raw) {
  try {
    return Address.parse(String(raw || '').trim()).toString();
  } catch {
    return null;
  }
}

async function fetchJson(path, init) {
  const url = `${API_BASE}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const text = await res.text();
    let json;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { raw: text };
    }
    return { ok: res.ok, status: res.status, json, url };
  } finally {
    clearTimeout(timer);
  }
}

function numberOrZero(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function printSection(title) {
  console.log(`\n=== ${title} ===`);
}

const inviter = normalizeAddress(INVITER_INPUT);
const invitee = normalizeAddress(INVITEE_INPUT);

if (!inviter) failFast('INVITER_WALLET 无效或未提供');
if (!invitee) failFast('INVITEE_WALLET 无效或未提供');

console.log('TAI 主网真实链路验收（只读）');
console.log(`API_BASE: ${API_BASE}`);
console.log(`INVITER: ${inviter}`);
console.log(`INVITEE: ${invitee}`);
console.log(`TIME: ${new Date().toISOString()}`);

const blockers = [];
const warnings = [];

function assertBlocker(condition, label, detail) {
  if (condition) {
    console.log(`✅ ${label}${detail ? ` | ${detail}` : ''}`);
    return;
  }
  const message = `❌ ${label}${detail ? ` | ${detail}` : ''}`;
  blockers.push(message);
  console.log(message);
}

function assertWarning(condition, label, detail) {
  if (condition) {
    console.log(`✅ ${label}${detail ? ` | ${detail}` : ''}`);
    return;
  }
  const message = `⚠️ ${label}${detail ? ` | ${detail}` : ''}`;
  warnings.push(message);
  console.log(message);
}

// 1) Health
printSection('Health');
const health = await fetchJson('/health');
assertBlocker(health.ok && health.json?.status === 'healthy', '/health healthy', `status=${health.json?.status || health.status}`);

// 2) Oracle + DepositVault price state
printSection('Oracle / DepositVault');
const oracleStatus = await fetchJson('/api/oracle/status');
const depositVault = oracleStatus.json?.depositVault;
const signerConfigured = Boolean(oracleStatus.json?.signer?.configured);
assertBlocker(oracleStatus.ok, '/api/oracle/status reachable', `http=${oracleStatus.status}`);
if (oracleStatus.ok) {
  assertWarning(Boolean(oracleStatus.json?.oracle?.priceUsd > 0), 'Oracle price > 0', `priceUsd=${oracleStatus.json?.oracle?.priceUsd}`);
  assertWarning(signerConfigured, 'Oracle signer configured', `configured=${signerConfigured}`);
  assertBlocker(Boolean(depositVault && depositVault.priceUsd > 0), 'DepositVault price initialized', `priceUsd=${depositVault?.priceUsd}`);
  assertBlocker(Boolean(depositVault && !depositVault.needsPush), 'DepositVault does not need push', `needsPush=${depositVault?.needsPush}`);
}

// 3) Invitee sale path
printSection('Invitee Sale Path');
const counts = await fetchJson(`/api/sale-v2/purchase-counts/${encodeURIComponent(invitee)}`);
assertBlocker(counts.ok, 'purchase-counts reachable', `http=${counts.status}`);
if (counts.ok) {
  const countsPayload = counts.json?.counts || counts.json?.purchaseCount || {};
  const total =
    numberOrZero(countsPayload?.tier1) +
    numberOrZero(countsPayload?.tier2) +
    numberOrZero(countsPayload?.tier3);
  assertWarning(total >= 1, 'Invitee has at least one purchase record', `total=${total}`);
}

const claimableInvitee = await fetchJson(`/api/sale-v2/claimable/${encodeURIComponent(invitee)}`);
assertBlocker(claimableInvitee.ok, 'invitee claimable reachable', `http=${claimableInvitee.status}`);
if (claimableInvitee.ok) {
  const pendingTai = numberOrZero(claimableInvitee.json?.pendingTotalTai || claimableInvitee.json?.pending_total_tai || 0) / 1e9;
  const unlockedTai = numberOrZero(claimableInvitee.json?.unlockedTai || claimableInvitee.json?.unlocked_tai || 0) / 1e9;
  console.log(`ℹ️ Invitee pending=${pendingTai} TAI, unlocked=${unlockedTai} TAI, source=${claimableInvitee.json?.source || 'n/a'}`);
}

// 4) Inviter invite/rebate path
printSection('Inviter Invite Path');
const inviteStats = await fetchJson(`/api/sale-v2/invite/stats/${encodeURIComponent(inviter)}`);
assertBlocker(inviteStats.ok, 'invite stats reachable', `http=${inviteStats.status}`);
if (inviteStats.ok) {
  const statsPayload = inviteStats.json?.stats || inviteStats.json || {};
  const inviteCode = statsPayload?.inviteCode || statsPayload?.code || 'n/a';
  const inviteCount = numberOrZero(statsPayload?.inviteCount ?? statsPayload?.invitedCount ?? 0);
  console.log(`ℹ️ inviter inviteCode=${inviteCode}, inviteCount=${inviteCount}`);
}

const inviteClaimable = await fetchJson(`/api/sale-v2/invite/claimable/${encodeURIComponent(inviter)}`);
assertBlocker(inviteClaimable.ok, 'invite claimable reachable', `http=${inviteClaimable.status}`);
if (inviteClaimable.ok) {
  const pending = numberOrZero(inviteClaimable.json?.pendingTotalTai || inviteClaimable.json?.pending_total_tai || 0) / 1e9;
  console.log(`ℹ️ inviter pending invite reward=${pending} TAI`);
}

// 5) Deposit/checkin path
printSection('Deposit / Checkin');
const depositGoals = await fetchJson(`/api/deposit/goals/${encodeURIComponent(invitee)}?include_claimed=true`);
assertBlocker(depositGoals.ok, 'deposit goals reachable', `http=${depositGoals.status}`);
if (depositGoals.ok) {
  const ladder = depositGoals.json?.ladder || {};
  console.log(`ℹ️ ladder fixed=${JSON.stringify(ladder.fixed_targets_usd || [])}, next=${ladder.next_required_usd}, customUnlocked=${ladder.custom_unlocked}`);
}

const checkin = await fetchJson(`/api/deposit/checkin/${encodeURIComponent(invitee)}`);
assertBlocker(checkin.ok, 'deposit checkin reachable', `http=${checkin.status}`);
if (checkin.ok) {
  console.log(`ℹ️ checkin streak=${checkin.json?.streak_days || 0}, total=${checkin.json?.total_days || 0}, can_checkin_today=${checkin.json?.can_checkin_today}`);
}

printSection('Summary');
if (warnings.length > 0) {
  console.log(`Warnings: ${warnings.length}`);
  for (const item of warnings) console.log(`- ${item}`);
}

if (blockers.length > 0) {
  console.log(`\nBLOCKERS: ${blockers.length}`);
  for (const item of blockers) console.log(`- ${item}`);
  process.exit(1);
}

console.log('\n✅ Real-chain acceptance read-only checks passed.');
