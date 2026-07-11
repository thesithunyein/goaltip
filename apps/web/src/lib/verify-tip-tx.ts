/**
 * On-chain verification for watch-party tips.
 * Fetches the Sepolia receipt and requires a successful ERC-20 Transfer
 * of the claimed USDt amount from the tipper to the room pool address.
 */

/** Aave v3 Sepolia test USDT (6 decimals) — same as tokens.ts. */
export const SEPOLIA_USDT = '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0'

/** keccak256("Transfer(address,address,uint256)") */
const TRANSFER_TOPIC =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

const DEFAULT_SEPOLIA_RPC = 'https://ethereum-sepolia-rpc.publicnode.com'

export class TipVerificationError extends Error {
  constructor (message: string) {
    super(message)
    this.name = 'TipVerificationError'
  }
}

type RpcReceipt = {
  status?: string | null
  logs?: Array<{
    address?: string
    topics?: string[]
    data?: string
  }>
} | null

function sepoliaRpcUrl (): string {
  return process.env.SEPOLIA_RPC_URL
    ?? process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL
    ?? DEFAULT_SEPOLIA_RPC
}

function normalizeAddress (addr: string): string {
  return addr.trim().toLowerCase()
}

function topicToAddress (topic: string): string {
  const hex = topic.toLowerCase().replace(/^0x/, '')
  return `0x${hex.slice(-40)}`
}

function parseAmountBase (amountStr: string, decimals: number): bigint {
  const trimmed = amountStr.trim()
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new TipVerificationError('Invalid tip amount.')
  }
  const [whole = '0', frac = ''] = trimmed.split('.')
  const fracPadded = (frac + '0'.repeat(decimals)).slice(0, decimals)
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fracPadded || '0')
}

async function rpcCall<T> (method: string, params: unknown[]): Promise<T> {
  const res = await fetch(sepoliaRpcUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    cache: 'no-store'
  })
  if (!res.ok) {
    throw new TipVerificationError(`Sepolia RPC error ${res.status}`)
  }
  const body = await res.json() as { result?: T, error?: { message?: string } }
  if (body.error) {
    throw new TipVerificationError(body.error.message ?? 'Sepolia RPC call failed')
  }
  return body.result as T
}

async function getReceipt (hash: string, attempts = 10, delayMs = 900): Promise<RpcReceipt> {
  for (let i = 0; i < attempts; i++) {
    const receipt = await rpcCall<RpcReceipt>('eth_getTransactionReceipt', [hash])
    if (receipt) return receipt
    if (i < attempts - 1) {
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }
  return null
}

/**
 * Verifies that `hash` is a successful Sepolia USDt transfer from `from`
 * to `poolAddress` for exactly `amount` (human units, 6 decimals).
 */
export async function verifyTipTransaction (opts: {
  hash: string
  from: string
  poolAddress: string
  amount: string
  tokenAddress?: string
  decimals?: number
}): Promise<void> {
  const hash = opts.hash.trim()
  if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
    throw new TipVerificationError('Invalid transaction hash.')
  }
  if (!opts.from?.trim()) {
    throw new TipVerificationError('Tip sender address is required for verification.')
  }

  const token = normalizeAddress(opts.tokenAddress ?? SEPOLIA_USDT)
  const pool = normalizeAddress(opts.poolAddress)
  const from = normalizeAddress(opts.from)
  const expected = parseAmountBase(opts.amount, opts.decimals ?? 6)

  const receipt = await getReceipt(hash)
  if (!receipt) {
    throw new TipVerificationError('Transaction not found on Sepolia yet. Wait a few seconds and try Refresh pool.')
  }
  if (receipt.status !== '0x1' && receipt.status !== '1') {
    throw new TipVerificationError('Transaction failed on-chain — tip not accepted.')
  }

  const logs = receipt.logs ?? []
  const match = logs.find((log) => {
    if (!log.address || normalizeAddress(log.address) !== token) return false
    const topics = log.topics ?? []
    if (topics.length < 3) return false
    if ((topics[0] ?? '').toLowerCase() !== TRANSFER_TOPIC) return false
    const logFrom = topicToAddress(topics[1]!)
    const logTo = topicToAddress(topics[2]!)
    if (logFrom !== from || logTo !== pool) return false
    const raw = (log.data ?? '0x0').replace(/^0x/, '') || '0'
    let amount: bigint
    try {
      amount = BigInt(`0x${raw}`)
    } catch {
      return false
    }
    return amount === expected
  })

  if (!match) {
    throw new TipVerificationError(
      'On-chain Transfer does not match this tip (token, from, pool, or amount). Tip rejected.'
    )
  }
}
