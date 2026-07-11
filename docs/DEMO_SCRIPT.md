# Demo script (~110s) — TipPool.tip + Verified + settle

## Timing
0:00–0:12  Hook: match night / loser buys drinks → GoalTip
0:12–0:28  Wallet: keys in Web Worker, show USDt balance
0:28–0:48  Create room → TipPool deploy → invite link
0:48–1:15  Device B joins → tip 1 USDt via TipPool.tip → **Verified** (Transfer + Tip event) → explorer
1:15–1:25  Over-cap attempt → blocked before signature
1:25–1:45  Host Settle → TipPool.settle → winner on both devices
1:45–1:55  Close: "WDK TipPool · optional QVAC + Pears locally"

## Spoken script (main cut)

It's match night — me and my friends are watching Myanmar versus Brazil, and someone always says loser buys drinks… and nobody ever pays. So I built GoalTip: a self-custodial wallet for football watch parties on Tether's WDK. Keys are generated in a Web Worker in my browser — no custodian. Here's my wallet with test USDt on Sepolia.

I create a shared room with a spend limit. Creating the room deploys a TipPool escrow contract on Sepolia. I copy the invite. On my friend's phone, they join the same room.

I tip one USDt for Myanmar — signed in the worker as TipPool.tip with the nation id on-chain. The board waits for the Transfer into TipPool and the Tip event, then shows Verified. Same hash on Etherscan. If I try to tip past the room cap, GoalTip blocks it before any signature.

When the match ends, I settle as host. That calls TipPool.settle on-chain, returns the escrowed USDt, and locks the board on every device so everyone sees the winner.

That's GoalTip. Built on Tether WDK for the Developers Cup — TipPool escrow, on-chain nation tips, verified settle. Thanks for watching.

## Optional multi-track clip (25–40s — splice for QVAC + Pears / Cup)

Record separately on a machine with GPU / enough RAM:

1. `pnpm add @qvac/sdk hyperswarm && pnpm demo`
2. Local app → Party header shows **Pears Np** when Hyperswarm is up
3. Coach tab → Recheck → ask "Who should I tip for Myanmar vs Brazil?" (reads live room totals)
4. Show "QVAC on-device · Pears Hyperswarm — both local, not on Vercel"
5. Splice after settle, keep total under 3:00

## Do NOT say on camera
- "WDK-enforced spend limit" — say server-enforced / blocked before signing
- That Vercel runs QVAC or Pears — both are local-only by design
