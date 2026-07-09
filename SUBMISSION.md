# DoraHacks BUIDL submission copy

## Project name
GoalTip

## Tagline
Self-custodial USDT fan tipping for football watch parties. Shared rooms, on-chain tips, keys stay in your browser.

## Track
WDK : Wallets (with optional QVAC local AI coach module)

## Description
GoalTip lets football fans tip USDt for their nation during watch parties without giving up custody of their keys. Built with Tether WDK in a Web Worker — BIP-39 generation, BIP-44 derivation, and transaction signing all happen client-side. Fans create a shared watch party room, invite friends by code or link, and tip 1/5/10 USDt or a custom amount. Every tip is a real ERC-20 transfer on Sepolia testnet with an Etherscan link. Tip boards sync across devices (metadata only — never keys). Optional local AI coach via QVAC SDK (LLAMA 3.2 1B, on-device, no cloud). Live demo works on mobile as an installable PWA.

## GitHub
https://github.com/thesithunyein/goaltip

## Demo video
https://youtu.be/u8otedpp1mI

## Live demo
https://goaltip-web.vercel.app

## Earlier work
Forked and extended [wdk-wallet-template](https://github.com/plinkdev1/wdk-wallet-template) (MIT). All GoalTip-specific features (shared watch parties, football UI, QVAC coach, Sepolia tipping) built during the Tether Developers Cup.

## External services
- Sepolia RPC (public)
- Vercel (hosting + party API routes — tip metadata only, no keys)
- Upstash Redis (optional shared room persistence)
- CoinGecko (optional USD pricing)
- YouTube (demo video hosting)

## Judge quickstart
```bash
pnpm install && pnpm dev
# Open http://localhost:3000 → Party tab → Create shared room
# Second browser: Join with room code or ?room=CODE
```

Faucets: Sepolia ETH + Aave test USDT (links in README.md).
Optional shared rooms on Vercel: set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.

## New demo script (90s)
See [docs/DEMO_SCRIPT.md](./docs/DEMO_SCRIPT.md) — two devices, shared board, explorer proof, optional QVAC clip.

## Resubmit checklist (before July 15)
1. Add Upstash env vars on Vercel (so shared rooms work in production)
2. Record new 90s video with two devices joining the same room
3. Paste new YouTube URL here and in DoraHacks Manage Submission
4. Keep track as WDK : Wallets (add QVAC only if the video shows a live local coach answer)
