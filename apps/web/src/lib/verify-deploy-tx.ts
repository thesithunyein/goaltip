/**
 * Verify TipPool deploy tx before accepting a new shared room.
 */

export class DeployVerificationError extends Error {
  constructor (message: string) {
    super(message)
    this.name = 'DeployVerificationError'
  }
}

const DEFAULT_SEPOLIA_RPC = 'https://ethereum-sepolia-rpc.publicnode.com'

function sepoliaRpcUrl (): string {
  return process.env.SEPOLIA_RPC_URL
    ?? process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL
    ?? DEFAULT_SEPOLIA_RPC
}

function normalizeAddress (addr: string): string {
  return addr.trim().toLowerCase()
}

type RpcReceipt = {
  status?: string | null
  from?: string | null
  contractAddress?: string | null
} | null

async function rpcCall <T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(sepoliaRpcUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    cache: 'no-store'
  })
  if (!res.ok) throw new DeployVerificationError(`Sepolia RPC error ${res.status}`)
  const body = await res.json() as { result?: T, error?: { message?: string } }
  if (body.error) {
    throw new DeployVerificationError(body.error.message ?? 'Sepolia RPC call failed')
  }
  return body.result as T
}

async function getReceipt (hash: string, attempts = 12, delayMs = 900): Promise<RpcReceipt> {
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
 * Ensures escrowDeployTxHash deployed poolAddress from hostAddress on Sepolia.
 */
export async function verifyTipPoolDeploy (opts: {
  hash: string
  hostAddress: string
  poolAddress: string
}): Promise<void> {
  const hash = opts.hash.trim()
  if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
    throw new DeployVerificationError('Invalid TipPool deploy transaction hash.')
  }

  const receipt = await getReceipt(hash)
  if (!receipt) {
    throw new DeployVerificationError(
      'TipPool deploy not found on Sepolia yet. Wait a few seconds and create again.'
    )
  }
  if (receipt.status !== '0x1' && receipt.status !== '1') {
    throw new DeployVerificationError('TipPool deploy transaction reverted on Sepolia.')
  }

  const deployed = receipt.contractAddress ? normalizeAddress(receipt.contractAddress) : ''
  const expectedPool = normalizeAddress(opts.poolAddress)
  if (!deployed || deployed !== expectedPool) {
    throw new DeployVerificationError(
      'Deploy receipt contractAddress does not match TipPool poolAddress.'
    )
  }

  const from = receipt.from ? normalizeAddress(receipt.from) : ''
  const host = normalizeAddress(opts.hostAddress)
  if (!from || from !== host) {
    throw new DeployVerificationError(
      'Deploy transaction sender does not match room hostAddress.'
    )
  }
}
