# GoalTip TipPool (Sepolia escrow)

Per-room USDt escrow deployed by the host when creating a watch party.

```bash
forge build
node ../scripts/embed-tip-pool.mjs   # writes apps/web/src/lib/tip-pool-bytecode.ts
```

- Tips: ERC-20 `transfer` into TipPool (verified by party API)
- Settle: `settle(bytes32 winnerNationId)` — host only; USDt returned to host; `Settled` event verified
