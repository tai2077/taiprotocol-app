# 财富学院 (app-tai)

Production-ready Telegram Mini App frontend with Neo-Brutalist UI.

## Mainnet Safety Rule (Hard Gate)

- 未经业务负责人**明确授权**，禁止在主网执行任何：
  - Oracle 推送
  - 价格写入
  - 解锁相关操作
- 所有上述操作必须走“人工确认 -> 指定窗口执行 -> 执行后复核”流程，并保留操作记录。

## What is implemented

- TonConnect wallet connect/disconnect
- Home dashboard
- Sale purchase flow (current deployed SaleContract tier model)
- Deposit lock flow (Vesting tx entry)
- Invite link + invite stats
- Rewards center + claim tx entry
- Leaderboard (invite ranking)
- Missions / Profile
- Global runtime safety (error boundary + non-blocking toast feedback)
- Hardened API client (timeout/retry/base-path fallback)

## Environment

Copy `.env.example` to `.env.local` and set values:

- `VITE_API_BASE` required
- `VITE_API_TIMEOUT_MS` optional
- Contract override vars optional

## Commands

- `npm run dev`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run bundle:check`
- `npm run standards:check`
- `npm run ci:offline`
- `npm run ci:online`
- `npm run smoke`
- `npm run smoke:offline`
- `npm run release:check`

## Launch checklist

1. Set production `VITE_API_BASE`
2. Verify `public/tonconnect-manifest.json` URLs
3. Run `npm run release:check`
4. Follow `RELEASE_RUNBOOK.md` for release window, Go/No-Go gates, and rollback steps
5. Validate Telegram in-app flow:
   - connect wallet
   - buy (sale)
   - lock (deposit)
   - invite stats
   - rewards claim
   - leaderboard load

## Notes

- Sale page currently follows deployed `buy_tier1/2/3` contract interface.
- Rewards page supports both Marketing Vault claim and Sale V2 claim (Ton Proof required).
- When migrating to new 50-stage sale contract, only sale tx params + sale stats mapping need replacement.
