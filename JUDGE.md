# Judge one-pager

## Live
- App: https://goaltip-web.vercel.app
- Health: https://goaltip-web.vercel.app/api/health  
  (also `/api/party/health`)  
  Expect `{ "persistence": "redis", "tipVerification": "sepolia-erc20-transfer", "settle": true }`

## 3-minute flow
1. Unlock / create wallet (Web Worker) → Party tab
2. **Create** shared room with spend limit (e.g. 10 USDt) → copy invite
3. Second browser/phone: open invite → same board
4. Tip 1 USDt → wait for **Verified** → open explorer (same hash)
5. Try tipping past the cap → blocked **before** any signature
6. Host taps **Settle match** → tips lock, winner shows on both devices

## Faucets
- Sepolia ETH: https://www.alchemy.com/faucets/ethereum-sepolia
- Test USDT: https://app.aave.com/faucet/ (Testnet Mode → Sepolia)

## What is real WDK
Keys generated and signed in a Web Worker. Tips are real Sepolia ERC-20 transfers. The party API verifies Transfer logs before accepting board tips. Spend caps are server-enforced and checked before signing.
