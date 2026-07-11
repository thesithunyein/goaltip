import { describe, it, expect } from 'vitest'
import { normalizeRoomCode, upsertTips, nationTotals, remainingCap, walletTotal, type TipRecord, type WatchParty } from './party-types'

describe('party-types', () => {
  it('normalizes room codes', () => {
    expect(normalizeRoomCode('  ab-12  ')).toBe('AB12')
    expect(normalizeRoomCode('9ufz1y!!!')).toBe('9UFZ1Y')
  })

  it('upserts tips by hash and keeps newest first', () => {
    const a: TipRecord = { nationId: 'mm', amount: '1', symbol: 'USDt', hash: '0xaaa', ts: 1 }
    const b: TipRecord = { nationId: 'br', amount: '5', symbol: 'USDt', hash: '0xbbb', ts: 2 }
    const a2: TipRecord = { nationId: 'mm', amount: '1', symbol: 'USDt', hash: '0xAAA', ts: 3 }
    const merged = upsertTips([a, b], a2)
    expect(merged).toHaveLength(2)
    expect(merged[0]?.hash).toBe('0xAAA')
    expect(merged[1]?.hash).toBe('0xbbb')
  })

  it('sums nation totals from verified tips only', () => {
    const party: WatchParty = {
      code: 'ABC123',
      nationA: 'mm',
      nationB: 'br',
      poolAddress: '0x' + '11'.repeat(20),
      tips: [
        { nationId: 'mm', amount: '1', symbol: 'USDt', hash: '0x1', ts: 1, verified: true },
        { nationId: 'mm', amount: '5', symbol: 'USDt', hash: '0x2', ts: 2, verified: true },
        { nationId: 'br', amount: '10', symbol: 'USDt', hash: '0x3', ts: 3, verified: true },
        { nationId: 'mm', amount: '99', symbol: 'USDt', hash: '0x4', ts: 4, verified: false }
      ]
    }
    const totals = nationTotals(party)
    expect(totals.get('mm')).toBe(6)
    expect(totals.get('br')).toBe(10)
  })

  it('computes per-wallet totals and remaining spend cap', () => {
    const alice = '0x' + 'aa'.repeat(20)
    const bob = '0x' + 'bb'.repeat(20)
    const party: WatchParty = {
      code: 'CAP123',
      nationA: 'mm',
      nationB: 'br',
      poolAddress: '0x' + '11'.repeat(20),
      capPerWallet: '10',
      tips: [
        { nationId: 'mm', amount: '4', symbol: 'USDt', hash: '0x1', ts: 1, from: alice },
        { nationId: 'br', amount: '3', symbol: 'USDt', hash: '0x2', ts: 2, from: alice },
        { nationId: 'mm', amount: '9', symbol: 'USDt', hash: '0x3', ts: 3, from: bob }
      ]
    }
    expect(walletTotal(party, alice)).toBe(7)
    expect(walletTotal(party, alice.toUpperCase())).toBe(7)
    expect(remainingCap(party, alice)).toBeCloseTo(3)
    expect(remainingCap(party, bob)).toBeCloseTo(1)

    const uncapped: WatchParty = { ...party, capPerWallet: undefined }
    expect(remainingCap(uncapped, alice)).toBeNull()
  })
})
