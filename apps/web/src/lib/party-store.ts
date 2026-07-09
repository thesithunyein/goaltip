/** Client-side localStorage cache + helpers for shared watch parties. */

import type { TipRecord, WatchParty } from './party-types'
import { nationTotals, normalizeRoomCode, partySharePath, remainingCap, upsertTips, walletTotal } from './party-types'

export type { TipRecord, WatchParty }
export { nationTotals, normalizeRoomCode, partySharePath, remainingCap, walletTotal }

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

export function setPartyCache (party: WatchParty): WatchParty {
  save(party)
  return party
}

/** Local-only create (legacy / offline). Prefer API create for shared rooms. */
export function createParty (opts: {
  nationA: string
  nationB: string
  poolAddress: string
}): WatchParty {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase()
  const party: WatchParty = { code, ...opts, tips: [], createdAt: new Date().toISOString() }
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
  const next: WatchParty = { ...current, tips: upsertTips(current.tips, tip) }
  save(next)
  return next
}

export function clearParty (): void {
  localStorage.removeItem(KEY)
}

export function inviteUrl (code: string): string {
  if (typeof window === 'undefined') return partySharePath(code)
  return `${window.location.origin}${partySharePath(code)}`
}

/** API client for shared rooms. */
export async function apiCreateParty (body: {
  nationA: string
  nationB: string
  poolAddress: string
  code?: string
  capPerWallet?: string
}): Promise<WatchParty> {
  const res = await fetch('/api/party', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    let message = 'Failed to create party'
    try {
      const data = await res.json() as { error?: string }
      if (data.error) message = data.error
    } catch {
      const text = await res.text().catch(() => '')
      if (text) message = text
    }
    throw new Error(message)
  }
  return await res.json() as WatchParty
}

export async function apiGetParty (code: string): Promise<WatchParty | null> {
  const res = await fetch(`/api/party/${encodeURIComponent(normalizeRoomCode(code))}`, {
    cache: 'no-store'
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(await res.text() || 'Failed to load party')
  return await res.json() as WatchParty
}

export async function apiAppendTip (code: string, tip: TipRecord): Promise<WatchParty> {
  const res = await fetch(`/api/party/${encodeURIComponent(normalizeRoomCode(code))}/tips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tip)
  })
  if (!res.ok) throw new Error(await res.text() || 'Failed to sync tip')
  return await res.json() as WatchParty
}
