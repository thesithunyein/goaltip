/** Shared watch-party types — used by client cache and API routes. */

export interface TipRecord {
  readonly nationId: string
  readonly amount: string
  readonly symbol: string
  readonly hash: string
  readonly ts: number
}

export interface WatchParty {
  readonly code: string
  readonly nationA: string
  readonly nationB: string
  readonly poolAddress: string
  readonly tips: readonly TipRecord[]
  /** ISO timestamp when the room was created (server-side). */
  readonly createdAt?: string
}

export function nationTotals (party: WatchParty): Map<string, number> {
  const totals = new Map<string, number>()
  for (const t of party.tips) {
    totals.set(t.nationId, (totals.get(t.nationId) ?? 0) + Number.parseFloat(t.amount))
  }
  return totals
}

export function makeRoomCode (): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export function normalizeRoomCode (code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
}

export function partySharePath (code: string): string {
  return `/?room=${encodeURIComponent(normalizeRoomCode(code))}`
}

/** Merge tips by tx hash (newest first). */
export function upsertTips (existing: readonly TipRecord[], tip: TipRecord): TipRecord[] {
  const without = existing.filter((t) => t.hash.toLowerCase() !== tip.hash.toLowerCase())
  return [tip, ...without].sort((a, b) => b.ts - a.ts)
}
