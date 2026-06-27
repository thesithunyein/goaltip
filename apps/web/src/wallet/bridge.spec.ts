import { describe, it, expect } from 'vitest'
import {
  bridgeRouteFor, isAddressForFamily, detectAddressFamily, crossVmSignpost,
} from './bridge'

const EVM = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
const BTC = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'

describe('bridgeRouteFor (pure route table)', () => {
  it('returns null for same-family (a normal send works)', () => {
    expect(bridgeRouteFor('evm', 'evm')).toBeNull()
  })

  it('is order-independent (sorted key)', () => {
    expect(bridgeRouteFor('evm', 'solana')).toEqual(bridgeRouteFor('solana', 'evm'))
  })

  it('points EVM↔Solana at Wormhole and provides a note for every pair', () => {
    expect(bridgeRouteFor('evm', 'solana')?.provider).toMatch(/Wormhole/)
    for (const [a, b] of [['evm', 'tron'], ['evm', 'ton'], ['bitcoin', 'evm'], ['ton', 'tron']] as const) {
      const r = bridgeRouteFor(a, b)
      expect(r).not.toBeNull()
      expect(typeof r?.note).toBe('string')
      expect(r?.note.length).toBeGreaterThan(0)
    }
  })
})

describe('engine-backed address detection', () => {
  it('validates an address against its own family', () => {
    expect(isAddressForFamily(EVM, 'evm')).toBe(true)
    expect(isAddressForFamily(EVM, 'solana')).toBe(false)
  })

  it('detects the family of a pasted address', () => {
    expect(detectAddressFamily(EVM)).toBe('evm')
    expect(detectAddressFamily(BTC)).toBe('bitcoin')
    expect(detectAddressFamily('not-an-address')).toBeNull()
  })
})

describe('crossVmSignpost', () => {
  it('returns null when the address matches the active family', () => {
    expect(crossVmSignpost('evm', EVM)).toBeNull()
  })

  it('signposts a bridge when a different family is pasted', () => {
    const post = crossVmSignpost('evm', BTC)
    expect(post?.detected).toBe('bitcoin')
    expect(typeof post?.note).toBe('string')
  })

  it('returns null for an unrecognizable address', () => {
    expect(crossVmSignpost('evm', 'garbage')).toBeNull()
  })
})
