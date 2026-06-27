import { describe, it, expect } from 'vitest'
import { encodeErc20Transfer } from './erc20'

const TO = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'

describe('encodeErc20Transfer', () => {
  it('builds selector + padded address + padded amount', () => {
    const data = encodeErc20Transfer(TO, 19_990_000n)
    expect(data.startsWith('0xa9059cbb')).toBe(true)
    // 0x + 8 selector + 64 address word + 64 amount word
    expect(data.length).toBe(2 + 8 + 64 + 64)
    const addrWord = data.slice(10, 10 + 64)
    const amtWord = data.slice(10 + 64)
    expect(addrWord.slice(-40)).toBe(TO.toLowerCase().slice(2))
    expect(BigInt('0x' + amtWord)).toBe(19_990_000n)
  })

  it('encodes a zero amount', () => {
    const data = encodeErc20Transfer(TO, 0n)
    expect(BigInt('0x' + data.slice(10 + 64))).toBe(0n)
  })

  it('rejects a malformed address and a negative amount', () => {
    expect(() => encodeErc20Transfer('0x123', 1n)).toThrow(/Invalid recipient/)
    expect(() => encodeErc20Transfer(TO, -1n)).toThrow(/non-negative/)
  })
})
