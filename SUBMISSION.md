# DoraHacks BUIDL submission copy

## Project name
GoalTip

## Tagline
Self-custodial USDT fan tipping for football watch parties. Shared rooms, on-chain tips, keys stay in your browser.

## Track
WDK : Wallets (with optional QVAC local AI coach module)

## Description
GoalTip lets football fans tip USDt for their nation during watch parties without giving up custody of their keys. Built with Tether WDK in a Web Worker — BIP-39 generation, BIP-44 derivation, and transaction signing all happen client-side. Fans create a shared watch party room, invite friends by code or link, and tip 1/5/10 USDt or a custom amount. Hosts can set a per-wallet spend limit for the match, enforced server-side and checked client-side before any transaction is signed. Every tip is a real ERC-20 transfer on Sepolia testnet with an Etherscan link. Tip boards sync across devices (metadata only — never keys). Optional local AI coach via QVAC SDK (LLAMA 3.2 1B, on-device, no cloud). Live demo works on mobile as an installable PWA.

## GitHub
https://github.com/thesithunyein/goaltip

## Demo video
https://youtu.be/u8otedpp1mI

## Live demo
https://goaltip-web.vercel.app

## Earlier work
Forked and extended [wdk-wallet-template](https://github.com/plinkdev1/wdk-wallet-template) (MIT). All GoalTip-specific features (shared watch parties, football UI, QVAC coach, Sepolia tipping, per-wallet spend limits) built during the Tether Developers Cup.

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
See [docs/DEMO_SCRIPT.md](./docs/DEMO_SCRIPT.md) — two devices, shared board, spend-limit block, explorer proof, optional QVAC clip.

## Resubmit checklist (before July 15)
1. Add Upstash env vars on Vercel (so shared rooms work in production)
2. Record new 90s video with two devices joining the same room, showing the spend-limit block
3. Paste new YouTube URL here and in DoraHacks Manage Submission
4. Keep track as WDK : Wallets (add QVAC only if the video shows a live local coach answer)

---

## Full BUIDL details (paste into DoraHacks)

**THE PROBLEM**
Every match night, fans in group chats say "loser buys drinks" and nobody settles up. Existing tipping apps either hold your keys (custodial) or force wallet extensions most casual fans do not have. GoalTip fixes the watch-party moment: back your nation, tip in USDt, prove it on-chain, keep your keys.

**WHAT GOALTIP IS**
GoalTip is a self-custodial fan tipping wallet for football watch parties. Fans create a shared room, pick two nations (e.g. Myanmar vs Brazil), invite friends by code or link, and tip USDt to rally behind their team. A live tip board syncs across devices. Every tip is a real ERC-20 transfer on Sepolia with an Etherscan link. No signup. No custodian. Keys never leave the browser.

**NOT A BET. NOT A TREASURY. MATCH-NIGHT TIPPING.**
Most WDK entries are prediction pots, team treasuries, or full payment suites. GoalTip is different: live nation tipping during the match. Shared room. Shared board. Self-custodial WDK tips. That is the product.

**WHY THIS IS REAL WDK (NOT A LOGO SLAP)**
GoalTip uses Tether WDK as the core wallet engine:
- BIP-39 mnemonic generation and verification inside a Web Worker
- BIP-44 key derivation for EVM accounts
- Encrypted vault (AES-GCM, password-derived key) in localStorage
- Transaction signing in the worker; private keys never reach the DOM or any server
- Real USDt ERC-20 sends on Sepolia, not mock balances

**SPEND LIMITS — DIRECTLY FROM THE WDK BRIEF**
The Tether Developers Cup rules ask WDK builders to "think about permissions, spending limits, recovery, and role separation." GoalTip implements this, not just claims it:
- The host sets a per-wallet USDt cap when creating the room (e.g. 10 USDt for the whole match)
- The cap is enforced **server-side** on every tip — the shared board rejects any tip that would push a wallet over the limit
- The client checks the cap **before** asking WDK to sign anything — if you are over budget, GoalTip refuses to initiate the transaction at all, so no signature is ever requested for a blocked tip
- The live board shows each wallet's remaining budget for the match in real time

**SHARED ROOMS (THE DEMO KILLER)**
This is not a single-wallet screenshot app.
- Create / join by room code
- Invite link: `?room=CODE`
- Live tip board sync across phones
- Server stores tip metadata only (nation, amount, tx hash, sender address). Never keys.
- Production persistence via Upstash Redis on Vercel

**OPTIONAL QVAC COACH**
On-device match coach powered by Tether QVAC (LLAMA 3.2 1B). No cloud. No API keys. Live site is offline by design; locally run `npm run coach`.

**LINKS**
- Live demo: https://goaltip-web.vercel.app
- Demo video: https://youtu.be/u8otedpp1mI
- GitHub: https://github.com/thesithunyein/goaltip

**JUDGE QUICKSTART**
```bash
pnpm install && pnpm dev
# Open http://localhost:3000 → Party → Create shared room (try enabling the spend limit)
# Second browser: Join with room code or ?room=CODE
```

**WHY THIS SHOULD WIN WDK : WALLETS**
Most WDK entries are prediction pots, treasuries, or payment suites. GoalTip is the watch-party tipping wallet: create a shared room, invite friends, tip USDt for your nation from a real WDK Web Worker wallet, and every device sees the same live tip board. Keys never leave the browser. Every tip is a real Sepolia ERC-20 with an Etherscan link. No custodian. No silent signing. No "trust the host." Spend limits are enforced server-side and checked before signing, directly answering the WDK track's own guidance on permissions and spending limits. Judges can try the full flow on mobile in under 3 minutes.

Built solo for the Tether Developers Cup. Forked from `wdk-wallet-template` (MIT). All GoalTip features (shared parties, football UI, tipping flow, per-wallet spend limits, QVAC coach) built during the event.
