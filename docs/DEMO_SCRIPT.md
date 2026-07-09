# New 90-second demo script (shared rooms + WDK tip + optional QVAC)

## Screen flow
0:00–0:15  Party tab — Create shared room (Myanmar vs Brazil). Copy invite link.
0:15–0:30  Second browser/phone — open invite link / Join with room code. Same match card.
0:30–0:55  Tip 5 USDt from device A. Show Recent tips (shared). Open explorer link.
0:55–1:10  Device B tips 1 USDt. Both boards update (Refresh / auto-poll).
1:10–1:25  Coach tab — show Offline badge on live site, OR local QVAC answer if coach is running.
1:25–1:30  Close: "Self-custodial WDK tips, shared watch party board. Built for Tether Developers Cup."

## Spoken script (natural, no em dashes)
So it's match night. Me and my friends are watching Myanmar versus Brazil. Someone always says loser buys drinks, and nobody pays. GoalTip fixes that.

I create a shared watch party. Here's the room code. My friend opens the invite link on another phone and joins the same room. Same match, same pool.

I tip five USDt for Myanmar. Keys stay in the WDK Web Worker. And here's the explorer link. Real on-chain transfer.

My friend tips one USDt for Brazil. Both boards update. Shared tip board, self-custodial wallets.

There's also a local AI coach on QVAC. On the live site it's offline by design because the model runs on your machine. Locally you run npm run coach and ask who to tip.

That's GoalTip. Built on Tether WDK for the Developers Cup. Thanks for watching.

## Optional QVAC clip (30s, record separately if GPU available)
1. pnpm add @qvac/sdk && npx @qvac/sdk doctor && npm run coach
2. Open http://localhost:3000 → Coach → Recheck → Online
3. Ask: "Who should I tip for Myanmar vs Brazil?"
4. Hold the answer on screen ~8 seconds
5. Splice into the main demo at 1:10 if you have it; otherwise keep the offline explanation
