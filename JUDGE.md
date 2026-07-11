# Judge one-pager

## Live
- App: https://goaltip-web.vercel.app
- Health: https://goaltip-web.vercel.app/api/health  
  Expect `{ "persistence": "redis", "tipVerification": "sepolia-erc20-transfer", "escrow": "tippool-per-room", "settle": "on-chain-tippool+board" }`

## 3-minute flow
1. Unlock / create wallet (Web Worker) → Party tab
2. **Create** shared room (deploys TipPool escrow + optional spend limit) → copy invite
3. Second browser/phone: open invite → same board
4. Tip 1 USDt → wait for **Verified** → open explorer (Transfer into TipPool)
5. Try tipping past the cap → blocked **before** any signature
6. Host taps **Settle** → TipPool.settle on-chain → board locks, winner on both devices

## Optional QVAC (local AI — multi-track)
```bash
pnpm add @qvac/sdk && npm run coach
# Coach tab → Recheck → ask a match question (on-device, no cloud)
```

## Faucets
- Sepolia ETH: https://www.alchemy.com/faucets/ethereum-sepolia
- Test USDT: https://app.aave.com/faucet/ (Testnet Mode → Sepolia)

## What is real WDK + escrow
Keys generated and signed in a Web Worker. Tips are real Sepolia ERC-20 transfers into a **TipPool contract** the host deploys at room create. The party API verifies Transfer logs before accepting tips. Host settle is an on-chain TipPool call (Settled event verified) plus board lock. Spend caps are server-enforced and checked before signing.
