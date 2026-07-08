# GoalTip ⚽

**Self-custodial USDT fan tipping for football watch parties — your keys, your tips, no custodian.**

Built for the [Tether Developers Cup](https://dorahacks.io/hackathon/tether-developers-cup) · **WDK : Wallets** track.

## What it does

- **Watch Party** — pick two nations, create a room, tip USDt to rally your team
- **Self-custodial wallet** — WDK runs in a Web Worker; keys never leave your browser
- **Sepolia testnet** — demo-safe USDT tips via `@tetherto/wdk`
- **Local AI Coach (QVAC)** — optional on-device football analyst (`npm run coach`)

## Live demo

Deploy to Vercel (see below) and open your URL. Judges: use the live link — no install required for the web app.

## Quick start (judges)

**Requirements:** Node 20+, pnpm 10

```bash
git clone <your-goaltip-repo-url>
cd goaltip
pnpm install
pnpm dev
```

Open http://localhost:3000

### Demo script (3 min)

1. Create wallet → save recovery phrase → unlock
2. Go to **Party** tab → create watch party (e.g. Myanmar vs Brazil)
3. Get Sepolia test ETH + USDt from faucets (below)
4. Tip your nation with preset amounts (1 / 5 / 10 USDt)
5. Show tx on [Sepolia Etherscan](https://sepolia.etherscan.io)
6. **Wallet** tab → show self-custodial address and USDt balance
7. **Coach** tab → run the optional QVAC coach locally after installing `@qvac/sdk`

## Testnet faucets

1. **Sepolia ETH** (gas): https://sepoliafaucet.com or https://www.alchemy.com/faucets/ethereum-sepolia
2. **Sepolia USDt** (mock): https://docs.candide.dev/welcome/guides/faucet/ or Pimlico test USDt

## Local QVAC coach (QVAC + WDK combo)

```bash
npx @qvac/sdk doctor   # verify GPU (4.5GB+ VRAM works with 1B model)
pnpm add @qvac/sdk     # optional Phase 2 dependency, not needed for the WDK web demo
npm run coach          # starts http://127.0.0.1:3847
pnpm dev               # open Coach tab in app
```

Uses `LLAMA_3_2_1B_INST_Q4_0` only — no cloud AI, no API keys.

## Deploy to Vercel

1. Push this repo to GitHub
2. Import in [Vercel](https://vercel.com) → set **Root Directory** to `apps/web`
3. Deploy (install/build commands are in `apps/web/vercel.json`)

## Architecture

```
Browser (Next.js on Vercel)
  ├── UI: Watch Party, Wallet, Coach
  └── Web Worker: WDK vault, signing, key derivation (Comlink)
        └── Keys NEVER sent to server

Local (optional): coach/server.mjs → QVAC SDK on-device LLM
```

Based on [wdk-wallet-template](https://github.com/plinkdev1/wdk-wallet-template) (MIT) — browser port of Tether WDK.

## External services

- Sepolia public RPC (via WDK chain config)
- Vercel (hosting)
- YouTube (demo video, unlisted)
- CoinGecko pricing (USD display, optional)

## Hackathon submission

| Field | Value |
|-------|--------|
| Track | WDK : Wallets (+ QVAC coach module) |
| Theme | Football watch-party fan tipping |
| License | MIT |
| Demo video | YouTube unlisted, ≤3 min |

See [SUBMISSION.md](./SUBMISSION.md) for DoraHacks copy-paste text.

## License

MIT — see [LICENSE](./LICENSE).
