/**
 * Verify TipPool.settle(bytes32) on Sepolia for escrow rooms.
 * Requires a successful receipt from the TipPool contract with Settled event.
 */

import { nationIdToBytes32 } from './tip-pool'

/** keccak256("Settled(address,bytes32,uint256)") */
const SETTLED_TOPIC =
  '0x8ec0095f0a0abbc8db397cd5246942293ac1a755825eba51c0ca828ec2102b64'

const DEFAULT_SEPOLIA_RPC = 'https://ethereum-sepolia-rpc.publicnode.com'

export class SettleVerificationError extends Error {
  constructor (message: string) {
    super(message)
    this.name = 'SettleVerificationError'
  }
}

type RpcReceipt = {
  status?: string | null
  to?: string | null
  logs?: Array<{
    address?: string
    topics?: string[]
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

async function ethGetReceipt (hash: string): Promise<RpcReceipt> {
  const res = await fetch(sepoliaRpcUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getTransactionReceipt',
      params: [hash]
    }),
    cache: 'no-store'
  })
  if (!res.ok) throw new SettleVerificationError(`Sepolia RPC HTTP ${res.status}`)
  const data = await res.json() as { result?: RpcReceipt, error?: { message?: string } }
  if (data.error) throw new SettleVerificationError(data.error.message ?? 'Sepolia RPC error')
  return data.result ?? null
}

export async function verifySettleTransaction (opts: {
  hash: string
  poolAddress: string
  hostAddress: string
  winnerNationId: string
}): Promise<void> {
  const hash = opts.hash.trim()
  if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
    throw new SettleVerificationError('Invalid settle transaction hash.')
  }

  let receipt: RpcReceipt = null
  for (let i = 0; i < 12; i++) {
    receipt = await ethGetReceipt(hash)
    if (receipt) break
    await new Promise((r) => setTimeout(r, 900))
  }
  if (!receipt) {
    throw new SettleVerificationError('Settle transaction not found yet on Sepolia. Wait a few seconds and retry.')
  }

  const status = receipt.status
  const ok = status === '0x1' || status === '1'
  if (!ok) throw new SettleVerificationError('Settle transaction failed on-chain.')

  const pool = normalizeAddress(opts.poolAddress)
  const host = normalizeAddress(opts.hostAddress)
  const winnerTopic = nationIdToBytes32(opts.winnerNationId).toLowerCase()

  const logs = receipt.logs ?? []
  const match = logs.find((log) => {
    if (!log.address || normalizeAddress(log.address) !== pool) return false
    const topics = log.topics ?? []
    if (topics[0]?.toLowerCase() !== SETTLED_TOPIC) return false
    if (!topics[1] || topicToAddress(topics[1]) !== host) return false
    if (!topics[2] || topics[2].toLowerCase() !== winnerTopic) return false
    return true
  })

  if (!match) {
    throw new SettleVerificationError(
      'On-chain Settled event does not match this room (TipPool, host, or winner). Settle rejected.'
    )
  }
}
