# DoraHacks BUIDL submission copy

## Project name
GoalTip

## Tagline
Self-custodial USDT fan tipping for football watch parties. Shared rooms, on-chain verified tips, keys stay in your browser.

## Track
WDK : Wallets (with optional QVAC local AI coach module)

## Description
GoalTip lets football fans tip USDt for their nation during watch parties without giving up custody of their keys. Built with Tether WDK in a Web Worker — BIP-39 generation, BIP-44 derivation, and transaction signing all happen client-side. Fans create a shared watch party room, invite friends by code or link, and tip 1/5/10 USDt or a custom amount. Hosts can set a per-wallet spend limit for the match, enforced server-side and checked client-side before any transaction is signed. Every tip is a real ERC-20 transfer on Sepolia; the party API verifies the on-chain Transfer (from, pool, amount) before the tip lands on the shared board. Hosts settle the match to lock tipping and show the winner on every device. Optional local AI coach via QVAC SDK (LLAMA 3.2 1B, on-device, no cloud). Live demo works on mobile as an installable PWA.

## GitHub
https://github.com/thesithunyein/goaltip

## Demo video
https://youtu.be/u8otedpp1mI
<!-- Replace after re-record with verify + settle beats -->

## Live demo
https://goaltip-web.vercel.app

## Earlier work
Forked and extended [wdk-wallet-template](https://github.com/plinkdev1/wdk-wallet-template) (MIT). All GoalTip-specific features (shared watch parties, football UI, QVAC coach, Sepolia tipping, per-wallet spend limits, on-chain tip verification, match settle) built during the Tether Developers Cup.

## External services
- Sepolia RPC (public) — used by the wallet worklet and by the party API for tip verification
- Vercel (hosting + party API routes — tip metadata only, no keys)
- Upstash Redis (shared room persistence — required for multi-device demos on Vercel)
- CoinGecko (optional USD pricing)
- YouTube (demo video hosting)

## Judge quickstart
```bash
pnpm install && pnpm dev
# Open http://localhost:3000 → Party tab → Create shared room (enable spend limit)
# Second browser: Join with room code or ?room=CODE
# Tip → wait for Verified badge → open explorer → try over-cap → host Settle match
```

Faucets: Sepolia ETH + Aave test USDT (links in README.md).
Production shared rooms: set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` on Vercel.
Health probe: `GET /api/party/health` → `{ persistence: "redis" | "memory" }`.

## New demo script (~100s)
See [docs/DEMO_SCRIPT.md](./docs/DEMO_SCRIPT.md) — two devices, Verified tip, spend-limit block, settle, explorer proof.

## Resubmit checklist (before July 12 cut)
1. Deploy this build to Vercel
2. Confirm `GET https://goaltip-web.vercel.app/api/party/health` returns `"persistence":"redis"`
3. Two-browser join on the live URL works
4. Record new ~100s video: Verified tip + spend-limit block + Settle
5. Paste new YouTube URL here and in DoraHacks Manage Submission
6. Keep track as WDK : Wallets (add QVAC only if the video shows a live local coach answer)

---

## Full BUIDL details (paste into DoraHacks)

**THE PROBLEM**
Every match night, fans in group chats say "loser buys drinks" and nobody settles up. Existing tipping apps either hold your keys (custodial) or force wallet extensions most casual fans do not have. GoalTip fixes the watch-party moment: back your nation, tip in USDt, prove it on-chain, keep your keys.

**WHAT GOALTIP IS**
GoalTip is a self-custodial fan tipping wallet for football watch parties. Fans create a shared room, pick two nations (e.g. Myanmar vs Brazil), invite friends by code or link, and tip USDt to rally behind their team. A live tip board syncs across devices. Every tip is a real ERC-20 transfer on Sepolia; the server verifies the Transfer before accepting it. The host settles the match to lock tips and show the winner. No signup. No custodian. Keys never leave the browser.

**NOT A BET. NOT A TREASURY. MATCH-NIGHT TIPPING.**
Most WDK entries are prediction pots, team treasuries, or full payment suites. GoalTip is different: live nation tipping during the match. Shared room. Shared board. On-chain verified WDK tips. Match settle. That is the product.

**WHY THIS IS REAL WDK (NOT A LOGO SLAP)**
GoalTip uses Tether WDK as the core wallet engine:
- BIP-39 mnemonic generation and verification inside a Web Worker
- BIP-44 key derivation for EVM accounts
- Encrypted vault (AES-GCM, password-derived key) in localStorage
- Transaction signing in the worker; private keys never reach the DOM or any server
- Real USDt ERC-20 sends on Sepolia, not mock balances

**ON-CHAIN TIP VERIFICATION**
The shared board does not trust client-reported tip metadata:
- After WDK signs and broadcasts, the party API fetches the Sepolia receipt
- It requires a successful ERC-20 Transfer of the claimed amount from the tipper to the room pool
- Only then does the tip land with a **Verified** badge (same hash as Etherscan)

**SPEND LIMITS — DIRECTLY FROM THE WDK BRIEF**
The Tether Developers Cup rules ask WDK builders to "think about permissions, spending limits, recovery, and role separation." GoalTip implements this, not just claims it:
- The host sets a per-wallet USDt cap when creating the room (e.g. 10 USDt for the whole match)
- The cap is enforced **server-side** on every tip — the shared board rejects any tip that would push a wallet over the limit
- The client checks the cap **before** asking WDK to sign anything — if you are over budget, GoalTip refuses to initiate the transaction at all, so no signature is ever requested for a blocked tip
- The live board shows each wallet's remaining budget for the match in real time

**MATCH SETTLE**
Host (pool wallet) picks the winning nation. Tips lock. Every device shows the winner and final totals — the "loser buys drinks" moment finally resolves on the board.

**SHARED ROOMS (THE DEMO KILLER)**
This is not a single-wallet screenshot app.
- Create / join by room code
- Invite link: `?room=CODE`
- Live tip board sync across phones
- Server stores tip metadata only (nation, amount, tx hash, sender address, verified). Never keys.
- Production persistence via Upstash Redis on Vercel

**OPTIONAL QVAC COACH**
On-device match coach powered by Tether QVAC (LLAMA 3.2 1B). No cloud. No API keys. Live site is offline by design; locally run `npm run coach`.

**LINKS**
- Live demo: https://goaltip-web.vercel.app
- Demo video: https://youtu.be/u8otedpp1mI
- GitHub: https://github.com/thesithunyein/goaltip
- Health: https://goaltip-web.vercel.app/api/party/health

**JUDGE QUICKSTART**
```bash
pnpm install && pnpm dev
# Open http://localhost:3000 → Party → Create shared room (enable spend limit)
# Second browser: Join with room code or ?room=CODE
# Tip → Verified → explorer → over-cap block → host Settle
```

**WHY THIS SHOULD WIN WDK : WALLETS**
Most WDK entries are prediction pots, treasuries, or payment suites. GoalTip is the watch-party tipping wallet: create a shared room, invite friends, tip USDt for your nation from a real WDK Web Worker wallet, verify each tip on-chain before it hits the board, enforce spend limits before signing, and settle the match so every device sees the winner. Keys never leave the browser. Judges can try the full flow on mobile in under 3 minutes.

Built solo for the Tether Developers Cup. Forked from `wdk-wallet-template` (MIT). All GoalTip features built during the event.
