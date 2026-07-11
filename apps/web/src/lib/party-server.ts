/**
 * Server-side party persistence.
 * Uses Upstash Redis REST when env vars are set; otherwise an in-memory Map
 * (fine for local `pnpm dev`, resets on cold start / multi-instance).
 */

import type { TipRecord, WatchParty } from './party-types'
import { makeRoomCode, normalizeRoomCode, upsertTips, walletTotal } from './party-types'

/** Thrown when a tip would push a wallet over the room's host-set spend cap. */
export class SpendCapExceededError extends Error {
  constructor (readonly capAmount: string, readonly alreadyTipped: number) {
    super(`Spend limit reached: this room caps tips at ${capAmount} USDt per wallet (already tipped ${alreadyTipped.toFixed(2)}).`)
    this.name = 'SpendCapExceededError'
  }
}

/** Thrown when the room is settled and no longer accepts tips. */
export class PartySettledError extends Error {
  constructor () {
    super('This match is settled — tipping is locked.')
    this.name = 'PartySettledError'
  }
}

/** Thrown when a tip hash is already on the shared board. */
export class DuplicateTipError extends Error {
  constructor (hash: string) {
    super(`Tip ${hash.slice(0, 10)}… is already on the shared board.`)
    this.name = 'DuplicateTipError'
  }
}

/** Thrown when a non-host tries to settle. */
export class SettleForbiddenError extends Error {
  constructor () {
    super('Only the room host can settle this match.')
    this.name = 'SettleForbiddenError'
  }
}

function hostOf (party: WatchParty): string {
  return (party.hostAddress ?? party.poolAddress).toLowerCase()
}

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
  hostAddress?: string
  escrowDeployTxHash?: string
  code?: string
  capPerWallet?: string
}): Promise<WatchParty> {
  const requested = opts.code ? normalizeRoomCode(opts.code) : ''
  const capPerWallet = opts.capPerWallet?.trim() || undefined
  const hostAddress = opts.hostAddress?.trim().toLowerCase() || undefined
  const escrowDeployTxHash = opts.escrowDeployTxHash?.trim().toLowerCase() || undefined

  const baseFields = {
    nationA: opts.nationA,
    nationB: opts.nationB,
    poolAddress: opts.poolAddress,
    tips: [] as TipRecord[],
    createdAt: new Date().toISOString(),
    ...(hostAddress ? { hostAddress } : {}),
    ...(escrowDeployTxHash ? { escrowDeployTxHash } : {}),
    ...(capPerWallet ? { capPerWallet } : {})
  }

  if (requested) {
    const existing = await getSharedParty(requested)
    if (existing) {
      // Same room already shared — return it (idempotent republish).
      if (
        existing.nationA === opts.nationA &&
        existing.nationB === opts.nationB &&
        existing.poolAddress.toLowerCase() === opts.poolAddress.toLowerCase()
      ) {
        return existing
      }
      throw new Error(`Room ${requested} already exists with different settings. Create a new room.`)
    }
    const party: WatchParty = { code: requested, ...baseFields }
    await saveSharedParty(party)
    return party
  }

  let code = makeRoomCode()
  for (let i = 0; i < 5; i++) {
    const existing = await getSharedParty(code)
    if (!existing) break
    code = makeRoomCode()
  }

  const party: WatchParty = { code, ...baseFields }

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

  if (party.settledAt) {
    throw new PartySettledError()
  }

  const hashLower = tip.hash.toLowerCase()
  if (party.tips.some((t) => t.hash.toLowerCase() === hashLower)) {
    throw new DuplicateTipError(tip.hash)
  }

  if (party.capPerWallet && tip.from) {
    const cap = Number.parseFloat(party.capPerWallet)
    const already = walletTotal(party, tip.from)
    const next = already + Number.parseFloat(tip.amount)
    // Small epsilon guards against float rounding on repeated decimal tips.
    if (Number.isFinite(cap) && next > cap + 1e-9) {
      throw new SpendCapExceededError(party.capPerWallet, already)
    }
  }

  const verifiedTip: TipRecord = { ...tip, verified: true }
  const next: WatchParty = {
    ...party,
    tips: upsertTips(party.tips, verifiedTip)
  }
  await saveSharedParty(next)
  return next
}

/**
 * Host settles the match: locks tips and records the winning nation.
 * Only the room host may settle (hostAddress, or legacy poolAddress).
 */
export async function settleSharedParty (
  code: string,
  opts: { winnerNationId: string, from: string, settleTxHash?: string, settledAmountUsdt?: string }
): Promise<WatchParty | null> {
  const party = await getSharedParty(code)
  if (!party) return null

  if (party.settledAt) {
    return party
  }

  const from = opts.from.trim().toLowerCase()
  if (from !== hostOf(party)) {
    throw new SettleForbiddenError()
  }

  const winner = opts.winnerNationId.trim().toLowerCase()
  if (winner !== party.nationA && winner !== party.nationB) {
    throw new Error('Winner must be one of the two nations in this room.')
  }

  const settleTxHash = opts.settleTxHash?.trim().toLowerCase() || undefined
  const settledAmountUsdt = opts.settledAmountUsdt?.trim() || undefined

  const next: WatchParty = {
    ...party,
    winnerNationId: winner,
    settledAt: new Date().toISOString(),
    ...(settleTxHash ? { settleTxHash } : {}),
    ...(settledAmountUsdt ? { settledAmountUsdt } : {})
  }
  await saveSharedParty(next)
  return next
}
