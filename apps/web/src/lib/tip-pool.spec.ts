import { describe, expect, it } from 'vitest'
import { encodeTipPoolSettle, encodeTipPoolTip, nationIdToBytes32, partyHostAddress } from './tip-pool'

describe('tip-pool helpers', () => {
  it('packs nation ids into bytes32', () => {
    expect(nationIdToBytes32('mm')).toBe(
      '0x6d6d000000000000000000000000000000000000000000000000000000000000'
    )
    expect(nationIdToBytes32('BR')).toBe(
      '0x6272000000000000000000000000000000000000000000000000000000000000'
    )
  })

  it('encodes settle(bytes32) calldata', () => {
    const data = encodeTipPoolSettle('mm')
    expect(data.startsWith('0x987757dd')).toBe(true)
    expect(data.length).toBe(2 + 8 + 64)
  })

  it('encodes tip(bytes32,uint256) calldata', () => {
    const data = encodeTipPoolTip('mm', 1_000_000n)
    expect(data.startsWith('0x43b37ddf')).toBe(true)
    expect(data.length).toBe(2 + 8 + 64 + 64)
  })

  it('resolves host from hostAddress or legacy poolAddress', () => {
    expect(partyHostAddress({
      poolAddress: '0xAbc',
      hostAddress: '0xDef'
    })).toBe('0xdef')
    expect(partyHostAddress({ poolAddress: '0xAbc' })).toBe('0xabc')
  })
})
