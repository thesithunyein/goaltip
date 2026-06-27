import { describe, it, expect } from 'vitest'
import {
  CHAINS, DEFAULT_CHAIN_ID, getChain, familyOf,
  isSolana, isBitcoin, isTon, isTron, formatAmount, parseAmount,
} from './chains'

describe('chain catalogue', () => {
  it('has the default chain and resolves it', () => {
    expect(DEFAULT_CHAIN_ID).toBe('plasma-mainnet')
    expect(getChain(DEFAULT_CHAIN_ID).name).toBe('Plasma')
  })

  it('every entry has a unique id and a known family', () => {
    const ids = CHAINS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const c of CHAINS) {
      expect(['evm', 'solana', 'bitcoin', 'ton', 'tron']).toContain(c.family)
    }
  })

  it('throws on an unknown chain', () => {
    expect(() => getChain('nope')).toThrow(/Unknown chain/)
  })

  it('family predicates agree with familyOf', () => {
    expect(familyOf('ethereum')).toBe('evm')
    expect(isSolana('solana-mainnet')).toBe(true)
    expect(isBitcoin('bitcoin-mainnet')).toBe(true)
    expect(isTon('ton-mainnet')).toBe(true)
    expect(isTron('tron-mainnet')).toBe(true)
    expect(isSolana('ethereum')).toBe(false)
  })
})

describe('formatAmount', () => {
  it('formats base units with trailing-zero trimming (6 dp display cap)', () => {
    expect(formatAmount(1_000_000n, 6)).toBe('1')
    expect(formatAmount(19_990_000n, 6)).toBe('19.99')
    expect(formatAmount(150_000_000n, 8)).toBe('1.5')
    expect(formatAmount(0n, 18)).toBe('0')
  })

  it('handles negatives', () => {
    expect(formatAmount(-19_990_000n, 6)).toBe('-19.99')
  })
})

describe('parseAmount', () => {
  it('parses a decimal string into base units', () => {
    expect(parseAmount('19.99', 6)).toBe(19_990_000n)
    expect(parseAmount('1', 18)).toBe(1_000_000_000_000_000_000n)
    expect(parseAmount('0.000001', 6)).toBe(1n)
  })

  it('rejects bad input and excess precision', () => {
    expect(() => parseAmount('', 6)).toThrow()
    expect(() => parseAmount('.', 6)).toThrow()
    expect(() => parseAmount('1.2.3', 6)).toThrow()
    expect(() => parseAmount('abc', 6)).toThrow()
    expect(() => parseAmount('1.9999999', 6)).toThrow(/Too many decimals/)
  })

  it('round-trips with formatAmount', () => {
    expect(formatAmount(parseAmount('123.456', 6), 6)).toBe('123.456')
  })
})
