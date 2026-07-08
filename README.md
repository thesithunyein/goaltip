# GoalTip ⚽

Self-custodial USDt tipping for football watch parties. Fans back a nation, tip live, and track the pool transparently.

Built for [Tether Developers Cup](https://dorahacks.io/hackathon/tether-developers-cup) on **WDK : Wallets**.

## 3-second judge view

- **Football-native use case:** watch party rooms and nation-vs-nation tipping
- **Real WDK usage:** key custody and signing stay inside a Web Worker
- **Self-custodial proof:** no private keys on Vercel/server
- **Demo-safe chain:** Sepolia + mock USDt
- **Bonus path:** optional local QVAC coach (no cloud AI)

## Links

- **Live demo:** https://goaltip-web.vercel.app
- **GitHub:** https://github.com/thesithunyein/goaltip
- **Demo video:** add your YouTube unlisted URL in `SUBMISSION.md`

## What judges can test fast

1. Create/import wallet
2. Open **Party** tab and create a watch room
3. Tip nation A or B with preset USDt amounts
4. Open tx on [Sepolia Etherscan](https://sepolia.etherscan.io)
5. Verify wallet is self-custodial in architecture notes below

## Judge quick start

Requirements: Node 20+, pnpm 10

```bash
git clone https://github.com/thesithunyein/goaltip.git
cd goaltip
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## 3-minute demo flow

1. Wallet setup: create wallet, show recovery phrase flow
2. Party setup: choose nations (example Myanmar vs Brazil)
3. Get test funds (links below), then tip 1/5/10 USDt
4. Show latest tips + explorer links
5. Show Wallet tab and self-custodial address
6. Optional: Coach tab with local QVAC server

## Testnet faucets

- Sepolia ETH (gas): https://www.alchemy.com/faucets/ethereum-sepolia
- Test USDT (mintable): https://app.aave.com/faucet/ — enable **Testnet Mode** (gear icon), pick Sepolia market, mint USDT
- Token contract used: [`0xaA8E...33D0`](https://sepolia.etherscan.io/address/0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0) (Aave v3 Sepolia test USDT, 6 decimals)

## Optional local QVAC coach (Phase 2)

```bash
npx @qvac/sdk doctor
pnpm add @qvac/sdk
npm run coach
pnpm dev
```

Model used: `LLAMA_3_2_1B_INST_Q4_0` (local only, no cloud API keys).

## Deploy to Vercel

1. Import this repo in [Vercel](https://vercel.com)
2. Set **Root Directory** to `apps/web`
3. Deploy (`apps/web/vercel.json` contains build/install commands)

## Architecture

```
Browser (Next.js on Vercel)
  ├── UI: Party, Wallet, Coach
  └── Web Worker (WDK): vault, derivation, signing
       └── private keys never leave client runtime

Optional local service:
  coach/server.mjs -> QVAC SDK local inference
```

## External services

- Sepolia public RPC (via WDK chain config)
- Vercel hosting
- YouTube unlisted demo video
- CoinGecko pricing (optional)

## Submission helper

Use [SUBMISSION.md](./SUBMISSION.md) as copy-paste text for DoraHacks.

## License

MIT — see [LICENSE](./LICENSE).
