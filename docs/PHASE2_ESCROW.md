# Phase 2 — TipPool escrow (SHIPPED)

Self-custodial WDK tips into an on-chain match pool; host settles after the whistle.

## How it works

1. **Create room** — host deploys a fresh `TipPool` via WDK (`contracts/src/TipPool.sol`). Room stores `poolAddress` (contract) + `hostAddress` (EOA).
2. **Tip** — fans send Sepolia USDt with a plain ERC-20 `transfer` to the TipPool. Party API verifies `Transfer(from=tipper, to=TipPool, amount)` before the board accepts the tip.
3. **Settle** — host calls `TipPool.settle(bytes32 winnerNationId)` on-chain (USDt returns to host). Board verifies the `Settled` event, then locks tips on every device.

## Pitch line

Self-custodial WDK tips into an on-chain TipPool escrow, settled after the whistle.

## Rebuild bytecode

```bash
cd contracts && forge build && node ../scripts/embed-tip-pool.mjs
```
