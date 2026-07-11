# Phase 2 — TipPool escrow (only if top 4)

Do **not** start this before the July 12 cut demo is recorded and Redis is confirmed.

## Goal
Self-custodial WDK tips into an on-chain match pool; host settles after the whistle.

## Minimal TipPool (Sepolia)
```solidity
// tip: USDt transferInto pool tagged with nationId (event Tip(from, nationId, amount))
// settle(winnerNationId): only host; emit Settled; optionally forward balance to payout address
```

## App wiring
1. Deploy TipPool; set `NEXT_PUBLIC_TIP_POOL` (or per-room create)
2. Party tips send USDt to TipPool (not host EOA)
3. Keep server `verifyTipTransaction` against pool address
4. Settle calls contract + updates board `winnerNationId` / `settledAt`

## Pitch line
Self-custodial WDK tips into an on-chain match pool, settled after the whistle.
