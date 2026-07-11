import { describe, expect, it, vi, afterEach } from 'vitest'
import { DeployVerificationError, verifyTipPoolDeploy } from './verify-deploy-tx'

const HASH = '0x' + '11'.repeat(32)
const HOST = '0x' + 'aa'.repeat(20)
const POOL = '0x' + 'bb'.repeat(20)

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('verifyTipPoolDeploy', () => {
  it('accepts matching successful deploy receipt', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          status: '0x1',
          from: HOST,
          contractAddress: POOL
        }
      })
    }))

    await expect(verifyTipPoolDeploy({
      hash: HASH,
      hostAddress: HOST,
      poolAddress: POOL
    })).resolves.toBeUndefined()
  })

  it('rejects mismatched contractAddress', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          status: '0x1',
          from: HOST,
          contractAddress: '0x' + 'cc'.repeat(20)
        }
      })
    }))

    await expect(verifyTipPoolDeploy({
      hash: HASH,
      hostAddress: HOST,
      poolAddress: POOL
    })).rejects.toBeInstanceOf(DeployVerificationError)
  })

  it('rejects non-host deployer', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          status: '0x1',
          from: '0x' + 'dd'.repeat(20),
          contractAddress: POOL
        }
      })
    }))

    await expect(verifyTipPoolDeploy({
      hash: HASH,
      hostAddress: HOST,
      poolAddress: POOL
    })).rejects.toThrow(/hostAddress/)
  })
})
