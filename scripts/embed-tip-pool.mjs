import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const artifact = JSON.parse(
  fs.readFileSync(path.join(root, 'contracts/out/TipPool.sol/TipPool.json'), 'utf8')
)
const bc = artifact.bytecode.object
const out = path.join(root, 'apps/web/src/lib/tip-pool-bytecode.ts')
const src = `/**
 * TipPool creation bytecode (forge build from contracts/src/TipPool.sol).
 * Host deploys one TipPool per room via WDK contract-creation tx (no to).
 * Regenerate: cd contracts && forge build && node ../scripts/embed-tip-pool.mjs
 */
export const TIP_POOL_CREATION_BYTECODE = '${bc}' as const

/** keccak256("settle(bytes32)") first 4 bytes */
export const SETTLE_SELECTOR = '0x987757dd' as const

/** Sepolia TipPool USDT constant (Aave v3 test USDT). */
export const TIP_POOL_USDT = '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0' as const
`
fs.writeFileSync(out, src)
console.log('Wrote', out, 'bytecode=', bc.length)
