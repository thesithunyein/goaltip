# Integrating WDK into Next.js

A focused, framework-specific guide to the parts that are *not* obvious when putting WDK in a Next.js app. Copy these into your own project to bootstrap a WDK wallet.

## 1. Run the engine in a Web Worker (the worklet)

Create a worker module that boots WDK and exposes it via Comlink:

```ts
// src/wallet/worker.ts
import '@wdk-starter/wdk-web-core/polyfill-globals'   // MUST be first
import * as Comlink from 'comlink'
import { WalletWorker } from '@wdk-starter/wdk-web-core/worker'
import { createHttpRpcAdapter } from '@wdk-starter/wdk-web-core'

const instance = new WalletWorker({ rpcAdapter: createHttpRpcAdapter() })
if (typeof (globalThis as any).postMessage === 'function') Comlink.expose(instance)
```

Spawn and wrap it on the main thread (once):

```ts
// src/wallet/wallet-client.ts
import * as Comlink from 'comlink'
import type { WalletWorker } from '@wdk-starter/wdk-web-core/worker'

const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
export const api = Comlink.wrap<WalletWorker>(worker)
```

> `new URL('./worker.ts', import.meta.url)` is the bundler-friendly worker syntax webpack (and Next.js) understands — it emits the worker as its own chunk.

## 2. Configure the browser polyfills (`next.config.mjs`)

WDK expects Node globals (`Buffer`, `process`) and compiles WebAssembly. Enable both for the client/worker build only:

```js
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin'

const nextConfig = {
  transpilePackages: ['@wdk-starter/wdk-ui', '@wdk-starter/wdk-web-core'],
  webpack (config, { isServer, webpack }) {
    config.experiments = { ...config.experiments, asyncWebAssembly: true }
    if (!isServer) {
      config.plugins.push(new NodePolyfillPlugin())
      config.plugins.push(new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'], process: 'process/browser' }))
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, net: false, tls: false }
      // Pin the browser-safe sodium backend (the native addon can't run in a worker)
      config.resolve.alias = { ...config.resolve.alias, 'sodium-native': 'sodium-javascript' }
    }
    return config
  }
}
export default nextConfig
```

Common pitfalls this avoids:
- **`Buffer is not defined`** → `ProvidePlugin` + `NodePolyfillPlugin`.
- **`WebAssembly module is included… experiments.asyncWebAssembly`** → enable the experiment.
- **A native `.node` binding error at runtime** → the `sodium-native → sodium-javascript` alias.

## 3. Keep the wallet client-side (SSR / edge boundaries)

Wallets are inherently client-side: the worklet (Web Worker), the encrypted vault
(IndexedDB + WebCrypto), and the decrypted key all live in the browser. The engine
has **no server story by design** — there is nothing to render, and nothing to
gate, on the server.

**The boundary is one file.** Only [`wallet/wallet-client.ts`](../apps/web/src/wallet/wallet-client.ts)
talks to the worker, and it refuses to run server-side:

```ts
export function getWalletApi (): WalletApi {
  if (typeof window === 'undefined') {
    throw new Error('The wallet worker is only available in the browser.')
  }
  // …spawns the Worker + Comlink-wraps it on first use
}
```

So an accidental server import surfaces as a clear error instead of a confusing
hydration mismatch. Everything that reaches the worker sits under a `'use client'`
boundary (`wallet-provider.tsx` and the components below it).

**Do**
- Mark wallet provider/components `'use client'`; render a neutral "loading" state
  during SSR and hydrate into the live wallet (the provider's `phase` does this).
- Gate wallet routes **on the client** — read vault/lock state from the worker and
  branch in a client component. The vault is client-only, so the server can't (and
  shouldn't) know whether a user is "logged in".

**Don't**
- Import `wallet-client.ts`, `@wdk-starter/wdk-web-core/worker`, or anything that
  reaches them from a Server Component, Route Handler, `middleware.ts`, or any
  `export const runtime = 'edge'` module — they need browser APIs (Worker,
  `crypto.subtle`, IndexedDB) that don't exist on the Node/edge server runtimes.
- Try to SSR a balance or an address. Derive them in the client after hydration.

This keeps the trust boundary intact: the key never crosses to the server, and the
SSR/edge surface stays free of wallet code.

## 4. Use the typed worker API

The Comlink proxy gives you the full `WalletWorker` surface as async methods:

```ts
await api.vault_hasStored()
await api.bip39_generateMnemonic()
await api.vault_store(password, new TextEncoder().encode(mnemonic))
await api.vault_load(password)              // also initializes WDK; throws on wrong password
await api.account_getEvmAddress(chainId, accountIndex)
await api.rpc_getBalance(chainId, address)
await api.account_sendTransaction(chainId, accountIndex, { to, value })
await api.lock()
await api.vault_clear()
```

## 5. Reuse the UI

`@wdk-starter/wdk-ui` ships the onboarding, unlock, primitives, theming, and chain-selector components used here. Wrap your app in `<WdkThemeProvider>` to get the CSS-variable design tokens the components consume.

## 6. Porting to another framework

Because the engine (`wdk-web-core`) is framework-agnostic and the worker bridge is just Comlink, a Vue/Svelte port reuses §1–§2 verbatim and only re-implements the view layer. That is the intended path to covering more of the bounty's framework list.
