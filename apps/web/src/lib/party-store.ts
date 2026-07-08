/** Watch-party state persisted in localStorage — no backend required tonight. */

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
}

const KEY = 'goaltip-party'

function load (): WatchParty | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) as WatchParty : null
  } catch {
    return null
  }
}

function save (party: WatchParty): void {
  localStorage.setItem(KEY, JSON.stringify(party))
}

export function getParty (): WatchParty | null {
  return load()
}

export function createParty (opts: {
  nationA: string
  nationB: string
  poolAddress: string
}): WatchParty {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase()
  const party: WatchParty = { code, ...opts, tips: [] }
  save(party)
  return party
}

export function updateParty (patch: Partial<Omit<WatchParty, 'tips'>>): WatchParty | null {
  const current = load()
  if (!current) return null
  const next = { ...current, ...patch }
  save(next)
  return next
}

export function recordTip (tip: TipRecord): WatchParty | null {
  const current = load()
  if (!current) return null
  const next: WatchParty = { ...current, tips: [tip, ...current.tips] }
  save(next)
  return next
}

export function clearParty (): void {
  localStorage.removeItem(KEY)
}

export function nationTotals (party: WatchParty): Map<string, number> {
  const totals = new Map<string, number>()
  for (const t of party.tips) {
    totals.set(t.nationId, (totals.get(t.nationId) ?? 0) + Number.parseFloat(t.amount))
  }
  return totals
}
