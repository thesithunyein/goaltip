/** Shared watch-party types — used by client cache and API routes. */

export interface TipRecord {
  readonly nationId: string
  readonly amount: string
  readonly symbol: string
  readonly hash: string
  readonly ts: number
  /** Sender wallet address — used to enforce the per-wallet spend cap. */
  readonly from?: string
  /** True only after the party API verified the Sepolia ERC-20 Transfer. */
  readonly verified?: boolean
}

export interface WatchParty {
  readonly code: string
  readonly nationA: string
  readonly nationB: string
  /**
   * USDt tip destination. Escrow rooms use a TipPool contract address;
   * legacy rooms used the host EOA.
   */
  readonly poolAddress: string
  /**
   * Room host EOA (settle authority). Escrow rooms always set this.
   * Legacy rooms omit it — host is inferred as poolAddress.
   */
  readonly hostAddress?: string
  /** Sepolia tx hash that deployed this room's TipPool (escrow rooms). */
  readonly escrowDeployTxHash?: string
  /** Sepolia tx hash of TipPool.settle (set after on-chain settle). */
  readonly settleTxHash?: string
  readonly tips: readonly TipRecord[]
  /** ISO timestamp when the room was created (server-side). */
  readonly createdAt?: string
  /**
   * Optional host-set spend limit: max total USDt any single wallet may tip
   * in this room, for the whole match. Enforced server-side on every tip.
   */
  readonly capPerWallet?: string
  /** Winning nation id after the host settles the match. */
  readonly winnerNationId?: string
  /** ISO timestamp when the host settled (tips lock after this). */
  readonly settledAt?: string
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

/** Total already tipped by one wallet in this room (case-insensitive match). */
export function walletTotal (party: WatchParty, address: string): number {
  const target = address.toLowerCase()
  return party.tips
    .filter((t) => t.from?.toLowerCase() === target)
    .reduce((sum, t) => sum + Number.parseFloat(t.amount), 0)
}

/**
 * Remaining spend budget for a wallet under the room's cap.
 * Returns `null` when the host set no cap (unlimited).
 */
export function remainingCap (party: WatchParty, address: string): number | null {
  if (!party.capPerWallet) return null
  const cap = Number.parseFloat(party.capPerWallet)
  if (!Number.isFinite(cap) || cap <= 0) return null
  return Math.max(0, cap - walletTotal(party, address))
}
