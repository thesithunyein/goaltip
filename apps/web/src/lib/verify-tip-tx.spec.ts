import { describe, it, expect, vi, afterEach } from 'vitest'
import { TipVerificationError, verifyTipTransaction, SEPOLIA_USDT } from './verify-tip-tx'

const TRANSFER_TOPIC =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

const FROM = '0x' + 'aa'.repeat(20)
const POOL = '0x' + 'bb'.repeat(20)
const HASH = '0x' + '11'.repeat(32)

function padAddress (addr: string): string {
  return '0x' + addr.replace(/^0x/, '').toLowerCase().padStart(64, '0')
}

function amountHex (base: bigint): string {
  return '0x' + base.toString(16).padStart(64, '0')
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('verifyTipTransaction', () => {
  it('accepts a matching successful Transfer log', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          status: '0x1',
          logs: [{
            address: SEPOLIA_USDT,
            topics: [TRANSFER_TOPIC, padAddress(FROM), padAddress(POOL)],
            data: amountHex(1_000_000n) // 1 USDt
          }]
        }
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(verifyTipTransaction({
      hash: HASH,
      from: FROM,
      poolAddress: POOL,
      amount: '1'
    })).resolves.toBeUndefined()
  })

  it('rejects failed receipts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: { status: '0x0', logs: [] } })
    }))

    await expect(verifyTipTransaction({
      hash: HASH,
      from: FROM,
      poolAddress: POOL,
      amount: '1'
    })).rejects.toBeInstanceOf(TipVerificationError)
  })

  it('rejects mismatched amount', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          status: '0x1',
          logs: [{
            address: SEPOLIA_USDT,
            topics: [TRANSFER_TOPIC, padAddress(FROM), padAddress(POOL)],
            data: amountHex(5_000_000n)
          }]
        }
      })
    }))

    await expect(verifyTipTransaction({
      hash: HASH,
      from: FROM,
      poolAddress: POOL,
      amount: '1'
    })).rejects.toThrow(/does not match/)
  })
})
