import { describe, it, expect } from 'vitest'
import { normalizeRoomCode, upsertTips, nationTotals, type TipRecord, type WatchParty } from './party-types'

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

  it('sums nation totals', () => {
    const party: WatchParty = {
      code: 'ABC123',
      nationA: 'mm',
      nationB: 'br',
      poolAddress: '0x' + '11'.repeat(20),
      tips: [
        { nationId: 'mm', amount: '1', symbol: 'USDt', hash: '0x1', ts: 1 },
        { nationId: 'mm', amount: '5', symbol: 'USDt', hash: '0x2', ts: 2 },
        { nationId: 'br', amount: '10', symbol: 'USDt', hash: '0x3', ts: 3 }
      ]
    }
    const totals = nationTotals(party)
    expect(totals.get('mm')).toBe(6)
    expect(totals.get('br')).toBe(10)
  })
})
