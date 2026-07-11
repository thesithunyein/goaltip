# Demo script (shared rooms + verified tip + spend limit + settle)

## Screen flow (~100s)
0:00–0:10  Party — hook ("match night / loser buys drinks").
0:10–0:22  Wallet (A) — show ~500 USDt, self-custodial, generated in a Web Worker.
0:22–0:32  Party (A) — Create shared room, enable spend limit (e.g. 10 USDt/wallet), copy invite.
0:32–0:40  Device B — Join room. Same match, same pool. No tip yet.
0:40–0:55  Device A — Tip 1 USDt Myanmar. Wait for **Verified** on the shared board.
0:55–1:02  Explorer — open the real tip from A, hold ~4 sec (same hash as Verified row).
1:02–1:10  Device A — Try to tip past the cap. Show it blocked *before* any signature is requested.
1:10–1:18  Device B — same tip, Verified badge, same remaining budget.
1:18–1:28  Device A (host) — Settle match (pick winner). Both devices show locked board + winner.
1:28–1:35  Close: "That's GoalTip. Built on Tether WDK for the Developers Cup."

## Spoken script (natural, no em dashes)

So it's match night. Me and my friends are watching Myanmar versus Brazil, and someone always says loser buys drinks... and nobody ever pays. So I built GoalTip.

It's a self-custodial wallet for football watch parties, built on Tether's WDK. Self-custodial means this: when I created this wallet, the recovery phrase and private keys were generated right here, inside a Web Worker in my browser. No server, no signup, no custodian. Nobody can touch my money but me. Here's my wallet. Real funds, five hundred USDt on Sepolia.

And here's tonight's shared watch party. I create a room, set a spend limit so nobody can overtip, and copy the invite link. My friend joins on another phone. Same match, same pool.

I tip one USDt for Myanmar. Signed locally in the worker, sent on-chain. Watch the board — GoalTip verifies the ERC-20 Transfer on Sepolia before the tip is accepted. Verified. Tap explorer. That's the same real transaction on Etherscan.

Now watch what happens if I try to go past the limit. GoalTip blocks it before it ever asks the wallet to sign. That's a real spending limit, enforced by the server, not just a warning label.

Flip to my friend's phone. Same tip, Verified, same remaining budget.

Match over. As host I settle — Myanmar wins. Tips lock on every device. Shared tip board, on-chain verification, self-custodial wallets, real spend limits, match settle.

That's GoalTip. Built on Tether WDK for the Developers Cup. Thanks for watching.

## One-paragraph take (for re-record)

So it's match night — me and my friends are watching Myanmar versus Brazil, and someone always says loser buys drinks… and nobody ever pays — so I built GoalTip, a self-custodial wallet for football watch parties on Tether's WDK: keys generated in a Web Worker in my browser, no custodian, here's five hundred USDt on Sepolia; I create a capped shared room, my friend joins, I tip one USDt for Myanmar signed in the worker, the board verifies the on-chain Transfer before accepting it — Verified — Etherscan proves the same hash; try to tip past the cap and it blocks before any signature; friend's phone shows the same Verified tip and budget; then I settle the match as host, tips lock, winner shows on both devices. That's GoalTip. Built on Tether WDK for the Developers Cup. Thanks for watching.

## Optional QVAC clip (30s, record separately if GPU available)
1. `pnpm add @qvac/sdk && npx @qvac/sdk doctor && npm run coach`
2. Open http://localhost:3000 → Coach → Recheck → Online
3. Ask: "Who should I tip for Myanmar vs Brazil?"
4. Hold the answer on screen ~8 seconds
5. Splice after settle only if you have it; otherwise skip QVAC in the main cut

## Recording tips
- Deploy Phase 1 (verify + settle) to Vercel before recording.
- Confirm Upstash Redis is set on Vercel so Device B can join the live room.
- Start recording after the app is already open — don't burn time on load screens.
- Hold the **Verified** badge and the **spend-limit block** — those are the proof beats.
- Settle is the closing product beat ("loser buys drinks" finally resolves on the board).
- Skip "B tips Brazil" unless Device B is funded.
