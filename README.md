<div align="center">

<img src="docs/goaltip-mark.png" alt="GoalTip" width="96" height="96" />

# GoalTip

**Self-custodial USDT tipping for football watch parties.**
Fans back a nation, tip live in USDt, and watch a **shared** pool grow — while their keys never leave the browser.

[**Live demo**](https://goaltip-web.vercel.app) · [**Demo video**](https://youtu.be/2p8f8a_Tj0w) · [Architecture](#architecture) · [Quick start](#quick-start)

Built with [Tether WDK](https://wdk.tether.io) for the [Tether Developers Cup](https://dorahacks.io/hackathon/tether-developers-cup) — **WDK : Wallets** track, with an optional [QVAC](https://qvac.tether.io) local-AI coach.

<img src="docs/screenshot-party.png" alt="GoalTip self-custodial wallet — funded with USDt on Sepolia testnet" width="720" />

</div>

---

## Why GoalTip

Every match night, fans in group chats say *"loser buys drinks"* — and then nobody settles up. GoalTip makes that moment real:

- **Create a shared watch party** for tonight's match (any two nations)
- **Invite friends** with a room code or link — every device sees the same tip board
- **Tip your nation** in USDt — 1, 5, 10, or any amount — signed locally with WDK
- **Verify on-chain** — every tip links to Sepolia Etherscan
- **Stay self-custodial** — GoalTip never touches your keys. Ever.

No signup, no custodian. Your wallet is generated in your browser, encrypted with your password, and signs everything locally. The shared board only stores tip *metadata* (nation, amount, tx hash) — never keys.

## Highlights

| | |
|---|---|
| Football-native | Nation-vs-nation tipping pools built around the watch-party moment |
| True self-custody | BIP-39/BIP-44 wallet lives in a Web Worker; private keys never reach the DOM or any server |
| Shared rooms | Create / join by code; invite link `?room=CODE`; live tip board sync across devices |
| Real on-chain USDt | ERC-20 transfers on Sepolia — every tip links to Etherscan |
| Local AI coach | Optional QVAC-powered match analyst (LLAMA 3.2 1B), on-device, no cloud |
| Installable PWA | Works on mobile, installs to the home screen |

## Quick start

Requirements: **Node 20+**, **pnpm 10**

```bash
git clone https://github.com/thesithunyein/goaltip.git
cd goaltip
pnpm install
pnpm dev
```

Open `http://localhost:3000` — create a wallet, open the **Party** tab, create or join a room, and tip.

Or skip setup: **https://goaltip-web.vercel.app**

### Shared rooms on Vercel (recommended)

For multi-device demos that survive serverless cold starts, add free [Upstash Redis](https://upstash.com) credentials in the Vercel project (Root Directory `apps/web`):

```
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

See [apps/web/.env.example](./apps/web/.env.example). Without Redis, rooms use in-memory storage (fine for local `pnpm dev`; on Vercel, prefer Upstash).

## Try the full flow in 3 minutes

1. **Create a wallet** — recovery phrase is generated inside a Web Worker
2. **Create a shared room** — pick nations (e.g. Myanmar vs Brazil), copy the invite link
3. **Join on a second device** — open the link or enter the room code
4. **Fund your wallet** (free testnet tokens):
   - Gas: [Alchemy Sepolia ETH faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
   - USDt: [Aave faucet](https://app.aave.com/faucet/) — enable **Testnet Mode**, Sepolia market, mint USDT
5. **Tip from both devices** — boards update for everyone; open `explorer` links
6. **Optional:** run the local QVAC coach (below)

The test USDt contract is [`0xaA8E…33D0`](https://sepolia.etherscan.io/address/0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0) (6 decimals).

Demo script for recording: [docs/DEMO_SCRIPT.md](./docs/DEMO_SCRIPT.md)

## Architecture

The security boundary is the Web Worker. The UI requests actions; the worker owns the seed, derives keys, and signs. Shared rooms sync tip metadata only.

```mermaid
flowchart TB
    subgraph Browser["Browser (Next.js on Vercel)"]
        UI["UI: Party · Wallet · Coach · Activity · Settings"]
        subgraph Worker["Web Worker — WDK worklet"]
            Vault["Encrypted vault"]
            Keys["BIP-39 / BIP-44"]
            Signer["Signing"]
        end
        Cache["localStorage cache"]
    end

    API["API /api/party<br/>tip metadata only"]
    Redis["Upstash Redis optional"]
    RPC["Sepolia public RPC"]
    Chain["USDt ERC-20 transfers"]
    QVAC["Optional local QVAC<br/>LLAMA 3.2 1B"]

    UI -- "Comlink" --> Worker
    Worker -- "signed tx" --> RPC
    RPC --> Chain
    UI -- "create / join / tips" --> API
    API --> Redis
    UI --- Cache
    UI -- "localhost only" --> QVAC
```

Key properties:

- **Keys never leave the worker.** The UI receives addresses and signed txs only.
- **Shared board is metadata-only.** Room code, nations, pool address, tip amounts + tx hashes. No private keys, no seed, no passwords.
- **Tips are ERC-20 transfers** to the party pool address, encoded client-side and signed in the worker.
- **QVAC is local-first.** The live site correctly shows the coach offline; run `npm run coach` on your machine for on-device answers.

## Project structure

```
goaltip/
├── apps/web/
│   └── src/
│       ├── app/api/party/     # Shared room create / get / tip sync
│       ├── components/        # Watch party, coach, wallet UI
│       ├── lib/               # party-store, party-server, nations
│       └── wallet/            # Chains, tokens, ERC-20, worker client
├── packages/wdk-web-core/     # WDK worklet
├── packages/wdk-ui/           # UI kit
├── coach/server.mjs           # Optional QVAC server
└── docs/                      # Architecture + demo script
```

## Optional: local AI coach (QVAC)

```bash
npx @qvac/sdk doctor
pnpm add @qvac/sdk
npm run coach
pnpm dev
```

Model: `LLAMA_3_2_1B_INST_Q4_0`. Coach tab shows an Online/Offline badge and setup steps when offline.

## Testing & CI

```bash
pnpm -F @wdk-starter/web typecheck
pnpm -F @wdk-starter/web test
pnpm build
```

## Deploy your own

1. Import the repo in [Vercel](https://vercel.com)
2. Set **Root Directory** to `apps/web`
3. Add Upstash env vars (recommended)
4. Deploy (`apps/web/vercel.json` has install/build commands)

## External services & credits

- **Tether WDK** — custody, derivation, signing
- **Tether QVAC SDK** (optional) — local AI
- **Sepolia public RPC** — broadcast (no key material)
- **Aave v3 Sepolia test USDT** — mintable demo token
- **Upstash Redis** (optional) — shared room persistence
- **Vercel** — hosting + API routes
- Built on `wdk-wallet-template` (MIT); GoalTip features built during the Tether Developers Cup

## Roadmap

- **P2P party sync** via Hyperswarm (Pears) so rooms need no central store
- **Smart-contract pool** with winner-nation claim logic
- **Match data feeds** from real fixtures
- **Mainnet USDt on Plasma** — one `DEFAULT_CHAIN_ID` flip away

## License

MIT — see [LICENSE](./LICENSE).

---

<div align="center">
<sub>Built in Myanmar for the Tether Developers Cup 2026</sub>
</div>
