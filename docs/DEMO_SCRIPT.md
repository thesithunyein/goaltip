# Demo script (shared rooms + WDK tip + spend limit + optional QVAC)

## Screen flow (~95s)
0:00–0:12  Party — hook ("match night / loser buys drinks").
0:12–0:25  Wallet (A) — show ~500 USDt, self-custodial, generated in a Web Worker.
0:25–0:35  Party (A) — Create shared room, enable the spend limit (e.g. 10 USDt/wallet), copy invite.
0:35–0:42  Device B — Join room. Same match, same pool. No tip yet.
0:42–0:55  Device A — Tip 1 USDt Myanmar (or up to the cap). Wait for confirm.
0:55–1:02  Device A — Try to tip past the cap. Show it blocked *before* any signature is requested.
1:02–1:08  Explorer — open the real tip from A, hold ~4 sec.
1:08–1:15  Device B — show the same tip (and the same remaining budget) on the shared board.
1:15–1:20  Coach (A) — quick QVAC status line.
1:20–1:25  Close: "That's GoalTip. Built on Tether WDK for the Developers Cup."

## Spoken script (natural, no em dashes)

So it's match night. Me and my friends are watching Myanmar versus Brazil, and someone always says loser buys drinks... and nobody ever pays. So I built GoalTip.

It's a self-custodial wallet for football watch parties, built on Tether's WDK. Self-custodial means this: when I created this wallet, the recovery phrase and private keys were generated right here, inside a Web Worker in my browser. No server, no signup, no custodian. Nobody can touch my money but me. Here's my wallet. Real funds, five hundred USDt on Sepolia.

And here's tonight's shared watch party. I create a room, set a spend limit so nobody can overtip, and copy the invite link. My friend joins on another phone. Same match, same pool.

I tip one USDt for Myanmar. Signed locally in the worker, sent on-chain. Now watch what happens if I try to go past the limit. GoalTip blocks it before it ever asks the wallet to sign. That's a real spending limit, enforced by the server, not just a warning label.

Tap explorer. That's a real transaction on Etherscan. Flip to my friend's phone. Same tip, same board, live, same remaining budget. Shared tip board, self-custodial wallets, real spend limits.

There's also an AI coach powered by Tether's QVAC. It runs on your device only. No cloud, no API keys. On the live site it's offline by design. Locally you run npm run coach.

That's GoalTip. Built on Tether WDK for the Developers Cup. Thanks for watching.

## Optional QVAC clip (30s, record separately if GPU available)
1. `pnpm add @qvac/sdk && npx @qvac/sdk doctor && npm run coach`
2. Open http://localhost:3000 → Coach → Recheck → Online
3. Ask: "Who should I tip for Myanmar vs Brazil?"
4. Hold the answer on screen ~8 seconds
5. Splice into the main demo at 1:15 if you have it; otherwise keep the offline explanation

## Recording tips
- Start recording after the app is already open — don't burn time on load screens.
- The spend-limit block (0:55–1:02) is the single most important new beat. It is proof, not a claim.
- Skip "B tips Brazil" unless Device B is funded.
