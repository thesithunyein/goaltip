# DoraHacks BUIDL submission copy

## Project name
GoalTip

## Tagline
Self-custodial USDT fan tipping for football watch parties. TipPool.tip tags nations on-chain; keys stay in your browser.

## Tracks
**WDK : Wallets** + **QVAC (Local AI)** + **Pears (Hyperswarm tip gossip)**

## Description
GoalTip lets football fans tip USDt for their nation during watch parties without giving up custody of their keys. Built with Tether WDK in a Web Worker. Creating a shared room deploys a TipPool escrow; fans call TipPool.tip(nationId, amount) so the nation is tagged on-chain; the party API verifies Transfer + Tip events before the board accepts. Hosts set spend limits and settle via TipPool.settle. Optional local QVAC coach (reads live room totals). Optional Pears Hyperswarm sidecar gossips tip announcements peer-to-peer. Live demo works on mobile as a PWA.

## GitHub
https://github.com/thesithunyein/goaltip

## Live demo
https://goaltip-web.vercel.app

## Judge page
https://goaltip-web.vercel.app/judge

## Demo video
https://youtu.be/u8otedpp1mI
<!-- REPLACE with new ≤3min TipPool.tip + Verified (Transfer+Tip) + settle (+ optional QVAC/Pears) video before final lock -->
## Earlier work
Forked and extended [wdk-wallet-template](https://github.com/plinkdev1/wdk-wallet-template) (MIT). All GoalTip-specific features (shared watch parties, TipPool escrow + tip(nationId), football UI, QVAC coach, Pears Hyperswarm sidecar, Sepolia tipping, spend limits, on-chain tip verification, match settle) built during the Tether Developers Cup.

## External services
- Sepolia RPC (public) — wallet worklet + tip/settle verification
- Vercel (hosting + party API — tip metadata only, no keys)
- Upstash Redis (shared room persistence)
- CoinGecko (optional USD pricing)
- YouTube (demo video)
- QVAC runs locally only (`npm run coach`) — not on Vercel
- Pears Hyperswarm sidecar runs locally only (`npm run pears`) — not on Vercel

## Judge quickstart
```bash
pnpm install && pnpm dev
# Party → Create shared room (deploys TipPool; enable spend limit)
# Second browser: Join with ?room=CODE
# Tip via TipPool.tip → Verified (Transfer + Tip) → explorer → over-cap → host Settle
# Optional triple-track:
#   cd pears && npm install && cd ..
#   pnpm add @qvac/sdk && pnpm demo
```

Health: `GET /api/health` → `persistence: redis-ok`, `escrow: tippool-per-room`, `settle: on-chain-tippool+board`, `deployVerification: sepolia-receipt`, `tipVerification: sepolia-erc20-transfer+tip-event`

## Final submission checklist
1. Deploy this build to Vercel; confirm Redis health
2. Two-browser TipPool.tip + Verified + Settle on live URL
3. Record ≤3min video (TipPool deploy → tip → Verified → over-cap → settle); optional QVAC + Pears splice
4. Paste new YouTube URL here + DoraHacks
5. Tick tracks: **WDK** + **QVAC** + **Pears** (show Coach + Pears Np in video)

---

## Full BUIDL details (paste into DoraHacks)

**THE PROBLEM**
Every match night, fans in group chats say "loser buys drinks" and nobody settles up. Custodial tip apps hold your keys; extension wallets scare casual fans. GoalTip fixes the watch-party moment: back your nation, tip USDt into an on-chain pool, prove it, keep your keys.

**WHAT GOALTIP IS**
A self-custodial fan tipping wallet for football watch parties. Create a shared room → deploy TipPool → invite friends → tip via TipPool.tip(nationId) so the nation is tagged on-chain → board verifies Transfer + Tip → host settles on-chain after the whistle. Optional on-device QVAC coach. Optional Pears Hyperswarm tip gossip. No signup. No custodian.

**WHY THIS IS REAL WDK (NOT A LOGO SLAP)**
- BIP-39 / BIP-44 / AES-GCM vault in a Web Worker
- Real Sepolia USDt sends signed in-worker
- Host deploys TipPool via WDK contract-creation tx
- Fans call TipPool.tip; host TipPool.settle — both verified by the party API

**ON-CHAIN ESCROW + VERIFICATION**
- TipPool.sol (MIT) — per-room escrow, tip(nationId), host immutable, settle pays USDt to host
- Tip verify: ERC-20 Transfer(tipper → TipPool, amount) + Tip(from, nationId, amount)
- Settle verify: Settled(host, winnerNationId, amount) event
- Spend limits: server-enforced + client check before any signature

**OPTIONAL QVAC + PEARS**
Local LLAMA 3.2 1B coach via `@qvac/sdk`. Hyperswarm tip gossip via `npm run pears`. Both offline on Vercel by design; `pnpm demo` starts them locally.

**LINKS**
- Live: https://goaltip-web.vercel.app
- Health: https://goaltip-web.vercel.app/api/health
- GitHub: https://github.com/thesithunyein/goaltip
- Judge: JUDGE.md · Demo script: docs/DEMO_SCRIPT.md

**WHY THIS SHOULD WIN WDK + CUP**
Clear football product, TipPool with on-chain nation Tip events, verified settle, spend limits from the WDK brief, multi-device rooms, optional QVAC + Pears multi-stack — judges can run the full flow in under 3 minutes.
