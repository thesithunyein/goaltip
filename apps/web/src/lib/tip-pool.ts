/**
 * TipPool helpers — deploy per-room escrow, encode settle, wait for contract address.
 */

import { SETTLE_SELECTOR, TIP_POOL_CREATION_BYTECODE } from './tip-pool-bytecode'

const DEFAULT_SEPOLIA_RPC = 'https://ethereum-sepolia-rpc.publicnode.com'

export function tipPoolCreationData (): string {
  return TIP_POOL_CREATION_BYTECODE
}

/** Pack a short nation id (e.g. "mm") into bytes32 (right-padded UTF-8). */
export function nationIdToBytes32 (nationId: string): string {
  const raw = nationId.trim().toLowerCase()
  if (!raw || raw.length > 31) {
    throw new Error('Invalid nation id for TipPool settle.')
  }
  let hex = ''
  for (let i = 0; i < raw.length; i++) {
    hex += raw.charCodeAt(i).toString(16).padStart(2, '0')
  }
  return `0x${hex.padEnd(64, '0')}`
}

/** ABI encode TipPool.settle(bytes32). */
export function encodeTipPoolSettle (nationId: string): string {
  return `${SETTLE_SELECTOR}${nationIdToBytes32(nationId).slice(2)}`
}

function sepoliaRpc (): string {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SEPOLIA_RPC_URL) {
    return process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL
  }
  return DEFAULT_SEPOLIA_RPC
}

async function rpcCall <T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(sepoliaRpc(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    cache: 'no-store'
  })
  if (!res.ok) throw new Error(`Sepolia RPC HTTP ${res.status}`)
  const data = await res.json() as { result?: T, error?: { message?: string } }
  if (data.error) throw new Error(data.error.message ?? 'Sepolia RPC error')
  return data.result as T
}

type Receipt = {
  status?: string | null
  contractAddress?: string | null
} | null

/**
 * Poll until the deploy tx has a contractAddress (or fail).
 */
export async function waitForDeployedTipPool (
  txHash: string,
  opts?: { attempts?: number, delayMs?: number }
): Promise<string> {
  const attempts = opts?.attempts ?? 20
  const delayMs = opts?.delayMs ?? 1200
  for (let i = 0; i < attempts; i++) {
    const receipt = await rpcCall<Receipt>('eth_getTransactionReceipt', [txHash])
    if (receipt) {
      const status = receipt.status
      const ok = status === '0x1' || status === '1'
      if (!ok && status != null) {
        throw new Error('TipPool deploy transaction reverted on Sepolia.')
      }
      const addr = receipt.contractAddress
      if (addr && /^0x[a-fA-F0-9]{40}$/.test(addr)) {
        return addr
      }
    }
    await new Promise((r) => setTimeout(r, delayMs))
  }
  throw new Error('TipPool deploy confirmed slowly — check Sepolia explorer and try Create again.')
}

/** Host identity for a room: hostAddress if set, else legacy poolAddress (EOA pool). */
export function partyHostAddress (party: { hostAddress?: string, poolAddress: string }): string {
  return (party.hostAddress ?? party.poolAddress).toLowerCase()
}
