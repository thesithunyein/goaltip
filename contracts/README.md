# GoalTip TipPool (Sepolia escrow)

Per-room USDt escrow deployed by the host when creating a watch party.

```bash
forge build
node ../scripts/embed-tip-pool.mjs   # writes apps/web/src/lib/tip-pool-bytecode.ts
```

- Preferred tip: `tip(bytes32 nationId, uint256 amount)` — `transferFrom` + `Tip` event (API verifies Transfer + Tip)
- Legacy tip: plain ERC-20 `transfer` into TipPool (still works; Tip event not required unless room has hostAddress)
- Settle: `settle(bytes32 winnerNationId)` — host only; USDt returned to host; `Settled` event verified
