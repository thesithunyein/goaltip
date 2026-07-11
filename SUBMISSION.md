# DoraHacks BUIDL submission copy

## Project name
GoalTip

## Tagline
Self-custodial USDT fan tipping for football watch parties. TipPool escrow, on-chain verified tips, keys stay in your browser.

## Tracks
**WDK : Wallets** + **QVAC (Local AI)** (optional coach module — tick both)

## Description
GoalTip lets football fans tip USDt for their nation during watch parties without giving up custody of their keys. Built with Tether WDK in a Web Worker — BIP-39 generation, BIP-44 derivation, and transaction signing all happen client-side. Creating a shared room deploys a TipPool escrow contract on Sepolia; fans tip into the contract; the party API verifies the on-chain Transfer before the tip lands on the shared board. Hosts set per-wallet spend limits (checked before signing) and settle the match by calling TipPool.settle on-chain — escrowed USDt returns to the host and every device locks. Optional local AI coach via QVAC SDK (LLAMA 3.2 1B, on-device, no cloud). Live demo works on mobile as an installable PWA.

## GitHub
https://github.com/thesithunyein/goaltip

## Live demo
https://goaltip-web.vercel.app

## Judge page
https://goaltip-web.vercel.app/judge

## Demo video
https://youtu.be/u8otedpp1mI
<!-- REPLACE with new ≤3min TipPool + Verified + settle (+ optional QVAC) video before final lock -->
## Earlier work
Forked and extended [wdk-wallet-template](https://github.com/plinkdev1/wdk-wallet-template) (MIT). All GoalTip-specific features (shared watch parties, TipPool escrow, football UI, QVAC coach, Sepolia tipping, spend limits, on-chain tip verification, match settle) built during the Tether Developers Cup.

## External services
- Sepolia RPC (public) — wallet worklet + tip/settle verification
- Vercel (hosting + party API — tip metadata only, no keys)
- Upstash Redis (shared room persistence)
- CoinGecko (optional USD pricing)
- YouTube (demo video)
- QVAC runs locally only (`npm run coach`) — not on Vercel

## Judge quickstart
```bash
pnpm install && pnpm dev
# Party → Create shared room (deploys TipPool; enable spend limit)
# Second browser: Join with ?room=CODE
# Tip → Verified → explorer → over-cap → host Settle (on-chain)
# Optional: pnpm add @qvac/sdk && npm run coach → Coach tab
```

Health: `GET /api/health` → `persistence: redis`, `escrow: tippool-per-room`, `settle: on-chain-tippool+board`

## Final submission checklist
1. Deploy this build to Vercel; confirm Redis health
2. Two-browser TipPool tip + Verified + Settle on live URL
3. Record ≤3min video (TipPool deploy → Verified → over-cap → settle); optional QVAC splice
4. Paste new YouTube URL here + DoraHacks
5. Tick tracks: **WDK** + **QVAC** (if video shows coach)

---

## Full BUIDL details (paste into DoraHacks)

**THE PROBLEM**
Every match night, fans in group chats say "loser buys drinks" and nobody settles up. Custodial tip apps hold your keys; extension wallets scare casual fans. GoalTip fixes the watch-party moment: back your nation, tip USDt into an on-chain pool, prove it, keep your keys.

**WHAT GOALTIP IS**
A self-custodial fan tipping wallet for football watch parties. Create a shared room → deploy TipPool → invite friends → tip USDt for your nation → board verifies every Transfer → host settles on-chain after the whistle. Optional on-device QVAC coach. No signup. No custodian.

**WHY THIS IS REAL WDK (NOT A LOGO SLAP)**
- BIP-39 / BIP-44 / AES-GCM vault in a Web Worker
- Real Sepolia USDt sends signed in-worker
- Host deploys TipPool via WDK contract-creation tx
- Tips into TipPool; settle via TipPool.settle — both verified by the party API

**ON-CHAIN ESCROW + VERIFICATION**
- TipPool.sol (MIT) — per-room escrow, host immutable, settle pays USDt to host
- Tip verify: ERC-20 Transfer(tipper → TipPool, amount)
- Settle verify: Settled(host, winnerNationId, amount) event
- Spend limits: server-enforced + client check before any signature

**OPTIONAL QVAC**
Local LLAMA 3.2 1B coach via `@qvac/sdk`. Data never leaves the machine. Live Vercel site shows coach offline by design; run `npm run coach` for demos.

**LINKS**
- Live: https://goaltip-web.vercel.app
- Health: https://goaltip-web.vercel.app/api/health
- GitHub: https://github.com/thesithunyein/goaltip
- Judge: JUDGE.md · Demo script: docs/DEMO_SCRIPT.md

**WHY THIS SHOULD WIN WDK + CUP**
Clear football product, real TipPool escrow, verified tips, spend limits from the WDK brief, multi-device rooms, optional QVAC multi-stack — judges can run the full flow in under 3 minutes.
