import { describe, it, expect } from 'vitest'
import { tokensFor } from './tokens'

describe('tokensFor', () => {
  it('lists the Tether assets on Ethereum (USDt + XAUt)', () => {
    const symbols = tokensFor('ethereum').map((t) => t.symbol)
    expect(symbols).toContain('USDt')
    expect(symbols).toContain('XAUt')
  })

  it('returns valid 0x token addresses with sane decimals', () => {
    for (const t of tokensFor('ethereum')) {
      expect(/^0x[0-9a-fA-F]{40}$/.test(t.address)).toBe(true)
      expect(t.decimals).toBeGreaterThan(0)
    }
  })

  it('returns an empty list for a chain with no configured tokens', () => {
    expect(tokensFor('unknown-chain')).toEqual([])
  })
})
