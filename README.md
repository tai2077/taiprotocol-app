# TAI Protocol App (app-tai)

Production-ready Telegram Mini App frontend with Neo-Brutalist UI.

## What is implemented

- TonConnect wallet connect/disconnect
- Onboarding goal setup
- Home dashboard
- Sale purchase flow (current deployed SaleContract tier model)
- Deposit lock flow (Vesting tx entry)
- Invite link + invite stats
- Rewards center + claim tx entry
- Leaderboard (invite ranking)
- Missions / Achievements / Profile
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
- `npm run build`
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
