/**
 * Server-side party persistence.
 * Uses Upstash Redis REST when env vars are set; otherwise an in-memory Map
 * (fine for local `pnpm dev`, resets on cold start / multi-instance).
 */

import type { TipRecord, WatchParty } from './party-types'
import { makeRoomCode, normalizeRoomCode, upsertTips } from './party-types'

const KEY_PREFIX = 'goaltip:party:'
const TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

type GlobalStore = { memory: Map<string, WatchParty> }
const g = globalThis as typeof globalThis & { __goaltipPartyStore?: GlobalStore }
function memoryStore (): Map<string, WatchParty> {
  if (!g.__goaltipPartyStore) g.__goaltipPartyStore = { memory: new Map() }
  return g.__goaltipPartyStore.memory
}

function redisConfigured (): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

async function redisCommand (command: unknown[]): Promise<unknown> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) throw new Error('Redis not configured')
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command),
    cache: 'no-store'
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Redis error ${res.status}: ${text}`)
  }
  const data = await res.json() as { result: unknown }
  return data.result
}

function keyFor (code: string): string {
  return KEY_PREFIX + normalizeRoomCode(code)
}

export async function getSharedParty (code: string): Promise<WatchParty | null> {
  const normalized = normalizeRoomCode(code)
  if (!normalized) return null

  if (redisConfigured()) {
    const raw = await redisCommand(['GET', keyFor(normalized)])
    if (typeof raw !== 'string' || !raw) return null
    try {
      return JSON.parse(raw) as WatchParty
    } catch {
      return null
    }
  }

  return memoryStore().get(normalized) ?? null
}

export async function createSharedParty (opts: {
  nationA: string
  nationB: string
  poolAddress: string
  code?: string
}): Promise<WatchParty> {
  let code = normalizeRoomCode(opts.code ?? makeRoomCode())
  if (!code) code = makeRoomCode()

  // Avoid collisions (rare with 6 chars; retry a few times).
  for (let i = 0; i < 5; i++) {
    const existing = await getSharedParty(code)
    if (!existing) break
    code = makeRoomCode()
  }

  const party: WatchParty = {
    code,
    nationA: opts.nationA,
    nationB: opts.nationB,
    poolAddress: opts.poolAddress,
    tips: [],
    createdAt: new Date().toISOString()
  }

  await saveSharedParty(party)
  return party
}

export async function saveSharedParty (party: WatchParty): Promise<void> {
  const code = normalizeRoomCode(party.code)
  const toSave: WatchParty = { ...party, code }

  if (redisConfigured()) {
    await redisCommand(['SET', keyFor(code), JSON.stringify(toSave), 'EX', TTL_SECONDS])
    return
  }

  memoryStore().set(code, toSave)
}

export async function appendSharedTip (code: string, tip: TipRecord): Promise<WatchParty | null> {
  const party = await getSharedParty(code)
  if (!party) return null
  const next: WatchParty = {
    ...party,
    tips: upsertTips(party.tips, tip)
  }
  await saveSharedParty(next)
  return next
}
