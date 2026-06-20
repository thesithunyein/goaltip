<div align="center">

<img src="./brand/01-master-mark/wdk-master-mark-256.png" alt="WDK Wallet" width="120" />

# WDK Wallet Template — Next.js

**A production-ready, self-custodial multi-chain wallet template for [Next.js](https://nextjs.org), built on [Tether's Wallet Development Kit (WDK)](https://docs.wallet.tether.io).**

Reference implementation for the Tether WDK **Template Wallet** bounty — extending WDK's starter templates beyond React Native to the web's most popular React framework.

[![CI](https://github.com/plinkdev1/wdk-wallet-template/actions/workflows/ci.yml/badge.svg)](https://github.com/plinkdev1/wdk-wallet-template/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-F4642F.svg)](./LICENSE)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-000.svg)](https://nextjs.org)
[![Worklet](https://img.shields.io/badge/keys-in%20a%20Web%20Worker-1f6feb.svg)](#architecture)

</div>

---

## Why this exists

WDK ships a starter template for **React Native** — but the web is where most wallets begin, and Next.js is its most popular React framework. Developers wanting to build a WDK wallet in Next.js have had to wire up the SDK, the secure-execution boundary, the worker bridge, and the wallet UX from scratch.

This template is the missing reference. It is a **real, working, self-custodial wallet**: encrypted seed vault, WDK-backed multi-chain key derivation and signing, live balances, send/receive with QR, and a transaction feed — all in an idiomatic Next.js App Router app. Fork it and you have a wallet in minutes, not weeks.

> **The secure-execution model the bounty asks for.** All seed custody, key derivation, and signing happen inside a dedicated **Web Worker — the "worklet"** — exactly as WDK prescribes. The React app holds only a [Comlink](https://github.com/GoogleChromeLabs/comlink) proxy and **never touches a private key**. The app layer owns UX, history, and monitoring; the worklet owns secrets.

> **Compounding leverage.** The wallet logic lives in two reusable, framework-agnostic packages — `wdk-web-core` (engine) and `wdk-ui` (components) — the *same* packages that power the [WDK Browser Extension](https://github.com/plinkdev1/wdk-wallet-extension). The Next.js app is a thin, idiomatic surface on top. Build the engine once; ship it on every framework.

---

## Features

- 🔐 **Self-custodial vault** — BIP-39 generate / import / validate, encrypted at rest with **AES-256-GCM + PBKDF2-SHA-512 (600k)** in IndexedDB.
- 🧵 **Worklet security** — WDK runs in a Web Worker; the UI talks to it over a typed Comlink bridge and can never read a key.
- ⛓️ **Multi-chain** — EVM (Plasma, Ethereum, Polygon, Arbitrum + testnets), **Solana**, **Bitcoin** (BIP-84), **TON** (v5r1), and **Tron** — each with one-line registry extensibility.
- 👛 **Multi-account** — standard BIP-44 derivation; switch accounts in the UI.
- 💸 **Send & Receive** — receive with QR + copy; send with **per-family address validation** (EVM/Solana/Bitcoin/TON/Tron), review, and explorer links.
- 📜 **Activity** — live status for transactions you submit, ready to extend with the **WDK Indexer API** for full history.
- 💵 **Fiat values** — native balances shown in **USD** via the WDK CoinGecko pricing client.
- 🎨 **Polished UX** — onboarding, unlock, and dashboard built from the `wdk-ui` component library with a themable design system.
- 🔁 **Lock / reset** — manual lock; reset restores from recovery phrase.

---

## Screenshots

| Onboarding | Recovery phrase | Dashboard |
|:--:|:--:|:--:|
| ![Onboarding](./media/screenshots/01-onboarding.png) | ![Recovery phrase](./media/screenshots/02-recovery-phrase.png) | ![Dashboard](./media/screenshots/05-dashboard.png) |

| Receive (QR) | Send | Multi-chain |
|:--:|:--:|:--:|
| ![Receive](./media/screenshots/07-receive.png) | ![Send](./media/screenshots/08-send.png) | ![Chains](./media/screenshots/06-chain-selector.png) |

**▶ Demo video:** [`media/demo/wdk-wallet-template-demo.webm`](./media/demo/wdk-wallet-template-demo.webm) — a full walkthrough (onboarding → dashboard → multi-chain → send/receive). Click **Download** / **Raw** on GitHub to view. The shot-by-shot script is in [`docs/DEMO.md`](./docs/DEMO.md).

> Screenshots are captured from the running app via headless Chromium against a throwaway test wallet (no real funds).

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Next.js App Router (client)                                  │
│   WalletProvider (React context, state machine)               │
│   onboarding · unlock · dashboard · send · receive · activity │   ← wdk-ui components
│                         │  Comlink proxy (typed RPC)          │
└─────────────────────────┼──────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  Web Worker — the "worklet" (the trust boundary)              │
│   WalletWorker (@wdk-starter/wdk-web-core)                    │
│     • WebCrypto vault (PBKDF2 + AES-GCM, IndexedDB)           │
│     • @tetherto/wdk — derivation, signing, tx broadcast       │
│     • chain registry · HTTP RPC adapter · indexer adapter     │
│   seed + private keys live ONLY here                          │
└──────────────────────────────────────────────────────────────┘
```

The full design — framework-selection rationale, the worklet boundary, the Comlink bridge, the state machine, and the integration plan — is in [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) (this is the bounty's M1 deliverable).

### Repository layout

```
wdk-wallet-template/
├── apps/
│   └── web/                  # The Next.js wallet template
│       └── src/
│           ├── app/          # App Router pages + providers
│           ├── wallet/       # worker.ts (worklet) · wallet-client (Comlink) · provider · chains
│           └── components/   # onboarding · unlock · dashboard · send · receive · activity
├── packages/
│   ├── wdk-web-core/         # Reusable engine (shared with the extension)
│   └── wdk-ui/               # Reusable React component library
├── brand/                    # Brand kit
└── docs/                     # Architecture (M1), setup, integration, demo
```

---

## Quickstart

**Prerequisites:** Node ≥ 20, `pnpm` 10 (`corepack enable`).

```bash
pnpm install
pnpm dev          # builds the shared packages, then starts Next.js at http://localhost:3000
```

Production build:

```bash
pnpm build        # builds packages + the Next.js app
pnpm start
```

Then open <http://localhost:3000>, create a wallet, and you're in. See [`docs/SETUP.md`](./docs/SETUP.md) for RPC configuration and troubleshooting.

---

## Supported chains & assets

| | Status |
|---|---|
| **Plasma, Ethereum, Polygon, Arbitrum** | ✅ derivation, signing, balances, send/receive |
| **Solana** (mainnet / devnet) | ✅ derivation, address, balances, **send** |
| **Bitcoin** (mainnet / testnet) | ✅ BIP-84 address, balance, **send** (Blockbook) |
| **TON** (mainnet) | ✅ v5r1 address, balance, **send** (TonCenter) |
| **Tron** (mainnet) | ✅ address, balance, **send** (TronGrid) |
| **USD fiat values** | ✅ via CoinGecko pricing client |
| **USDt / XAUt tokens** | 🚧 engine ships balances + transfers; UI surfacing next |
| **Lightning (Spark)** | 🚧 roadmap (engine bundler-shim work; see [ROADMAP.md](./ROADMAP.md)) |

The template is transparent about implemented vs. planned scope. Adding a chain is a single entry in `apps/web/src/wallet/chains.ts` plus a loader in `wdk-web-core`.

---

## How it integrates WDK

- **The worklet** (`apps/web/src/wallet/worker.ts`) loads the WDK polyfills, constructs `WalletWorker` with an HTTP RPC adapter, and exposes it via Comlink.
- **The client** (`wallet-client.ts`) spawns the worker once and wraps it with `Comlink.wrap<WalletWorker>`.
- **The provider** (`wallet-provider.tsx`) is a React context + state machine (`loading → no-vault → locked → unlocked`) that calls the worklet for every privileged operation.
- **Next.js config** (`next.config.mjs`) enables the browser polyfills (Buffer/process) and WebAssembly the WDK crypto stack needs, and pins the pure-JS sodium backend for the browser.

Framework-specific notes are in [`docs/INTEGRATION.md`](./docs/INTEGRATION.md).

---

## Quality

- **Strict TypeScript** across the app and both packages.
- **`pnpm typecheck`** and **`pnpm test`** (the shared packages carry 446 passing tests) run in CI on every push, followed by a full `next build`.
- The worklet is runtime-verified: a headless smoke test boots the worker, derives, and generates a mnemonic through the real UI.

---

## Documentation

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — **M1**: framework selection, the worklet model, integration plan.
- [`docs/SETUP.md`](./docs/SETUP.md) — install, run, configure RPC, troubleshoot.
- [`docs/INTEGRATION.md`](./docs/INTEGRATION.md) — how WDK is wired into Next.js (worker, polyfills, Comlink).
- [`docs/DEMO.md`](./docs/DEMO.md) — the demo-video walkthrough script.

---

## Roadmap

📍 **Full phased roadmap: [`ROADMAP.md`](./ROADMAP.md).** It shows what ships today
(worklet architecture, EVM + Solana + Bitcoin + TON + Tron, onboarding/send/receive/activity + USD values) and how the
**shared `wdk-web-core` engine** unlocks Bitcoin, tokens, Lightning (Spark),
account abstraction, TON/Tron, in-wallet DeFi, and fiat pricing across this
template and the other WDK surfaces — one engine, many products.

---

## License

[MIT](./LICENSE). Built with [Tether WDK](https://docs.wallet.tether.io). A community reference implementation submitted to the Tether WDK bounty program; not an official Tether product.
