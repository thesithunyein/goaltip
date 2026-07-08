# DoraHacks BUIDL submission copy

## Project name
GoalTip

## Tagline
Self-custodial USDT fan tipping for football watch parties — your keys, your tips, no custodian.

## Track
WDK : Wallets (with optional QVAC local AI coach module)

## Description
GoalTip lets football fans tip USDt for their nation during watch parties without giving up custody of their keys. Built with Tether WDK in a Web Worker — all signing happens client-side. Watch party rooms track nation-vs-nation tipping pools on Sepolia testnet. Optional local AI coach (QVAC SDK, on-device LLM) suggests which nation to tip with zero cloud AI.

## GitHub
YOUR_GITHUB_URL

## Demo video
YOUR_YOUTUBE_UNLISTED_URL

## Live demo
YOUR_VERCEL_URL

## Earlier work
Forked and extended [wdk-wallet-template](https://github.com/plinkdev1/wdk-wallet-template) (MIT). All GoalTip-specific features (watch party, football UI, QVAC coach) built during the Tether Developers Cup.

## External services
- Sepolia RPC (public)
- Vercel (static/SSR hosting — no keys on server)
- CoinGecko (optional USD pricing)
- YouTube (demo video hosting)

## Judge quickstart
```bash
pnpm install && pnpm dev
# Open http://localhost:3000 → Party tab
```

Faucets: Sepolia ETH + mock USDt (links in README.md).

## Demo video script (2:50)
1. Hook: fan tipping without custodians
2. Create wallet, show keys stay local
3. Watch party: Myanmar vs Brazil, tip 1 USDt
4. Leaderboard + explorer link
5. WDK Web Worker architecture in README
6. Optional: local QVAC coach (`npm run coach`)
