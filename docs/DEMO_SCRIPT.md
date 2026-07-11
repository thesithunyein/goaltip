# Demo script (~110s) — TipPool + Verified + settle

## Timing
0:00–0:12  Hook: match night / loser buys drinks → GoalTip
0:12–0:28  Wallet: keys in Web Worker, show USDt balance
0:28–0:48  Create room → TipPool deploy → invite link
0:48–1:10  Device B joins → tip 1 USDt → **Verified** → explorer into TipPool
1:10–1:22  Over-cap attempt → blocked before signature
1:22–1:40  Host Settle → TipPool.settle → winner on both devices
1:40–1:50  Close: "Built on Tether WDK — TipPool escrow, self-custodial."

## Spoken script (main cut)

It's match night — me and my friends are watching Myanmar versus Brazil, and someone always says loser buys drinks… and nobody ever pays. So I built GoalTip: a self-custodial wallet for football watch parties on Tether's WDK. Keys are generated in a Web Worker in my browser — no custodian. Here's my wallet with test USDt on Sepolia.

I create a shared room with a spend limit. Creating the room deploys a TipPool escrow contract on Sepolia — tips go into the contract, not my personal address. I copy the invite. On my friend's phone, they join the same room.

I tip one USDt for Myanmar — signed in the worker. The board waits for the on-chain Transfer into TipPool, then shows Verified. Same hash on Etherscan. If I try to tip past the room cap, GoalTip blocks it before any signature.

When the match ends, I settle as host. That calls TipPool.settle on-chain, returns the escrowed USDt, and locks the board on every device so everyone sees the winner.

That's GoalTip. Built on Tether WDK for the Developers Cup — TipPool escrow, verified tips, spend limits. Thanks for watching.

## Optional QVAC clip (25–30s — splice for multi-track / Cup)

Record separately on a machine with GPU / enough RAM:

1. `pnpm add @qvac/sdk && npm run coach`
2. Local `pnpm dev` → Coach tab → Recheck → ask "Who should I tip for Myanmar vs Brazil?"
3. Show the local answer + "runs on-device, no cloud"
4. Splice after settle, or cut as a B-roll appendix under 3:00 total

## Do NOT say on camera
- "WDK-enforced spend limit" — say server-enforced / blocked before signing
- That Vercel runs QVAC — it is local-only by design
