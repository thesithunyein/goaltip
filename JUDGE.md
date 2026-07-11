# Judge one-pager

## Live
- App: https://goaltip-web.vercel.app
- **Judge page:** https://goaltip-web.vercel.app/judge
- Health: https://goaltip-web.vercel.app/api/health  
  Expect `persistence: redis`, `escrow: tippool-per-room`, `settle: on-chain-tippool+board`

## Tracks (tick all three on DoraHacks)
**WDK** · **QVAC** · **Pears**

## 3-minute flow
1. Unlock wallet (Web Worker) → Party
2. Create room → TipPool deploy → invite
3. Device B joins → tip USDt via `TipPool.tip(nationId)` → **Verified** (Transfer + Tip event)
4. Over-cap blocked before signature
5. Host Settle → TipPool.settle → escrow paid + board locks

## Optional multi-track (record on localhost)
```bash
pnpm add @qvac/sdk hyperswarm
pnpm demo
# Coach tab = QVAC (reads Party totals)
# Party header shows Pears Np when Hyperswarm sidecar is up
```

## Faucets
- Sepolia ETH: https://www.alchemy.com/faucets/ethereum-sepolia
- Test USDT: https://app.aave.com/faucet/ (Testnet Mode → Sepolia)

## What is real
- **WDK:** keys + TipPool deploy/tip/settle in Web Worker
- **TipPool:** on-chain nation Tip event + settle payout
- **QVAC:** on-device coach (local)
- **Pears:** Hyperswarm tip gossip sidecar (local)
