/**
 * Cross-VM bridge signposting (ADR-005).
 *
 * A self-custodial wallet must NEVER broadcast a transfer to an address from a
 * different network family (e.g. a Solana address while sending on EVM) — the
 * funds would be unrecoverable. Instead of a flat "invalid address" error, the
 * send flow detects which family the pasted address belongs to and points the
 * user at the right bridge. This module is the route table + detector; it does
 * not move funds (bridging happens in the dedicated provider's UI).
 */
import type { ChainFamily } from './chains'

const ADDRESS_RE: Record<ChainFamily, RegExp> = {
  evm: /^0x[0-9a-fA-F]{40}$/,
  solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  bitcoin: /^(bc1|tb1)[0-9ac-hj-np-z]{11,87}$|^[123mn2][a-km-zA-HJ-NP-Z1-9]{25,39}$/,
  ton: /^[A-Za-z0-9_-]{48}$|^-?\d:[0-9a-fA-F]{64}$/,
  tron: /^T[1-9A-HJ-NP-Za-km-z]{33}$/
}

export const FAMILY_LABEL: Record<ChainFamily, string> = {
  evm: 'EVM',
  solana: 'Solana',
  bitcoin: 'Bitcoin',
  ton: 'TON',
  tron: 'Tron'
}

/** Does `addr` look valid for `family`? */
export function isAddressForFamily (addr: string, family: ChainFamily): boolean {
  return ADDRESS_RE[family].test(addr.trim())
}

/**
 * Best-effort detection of which family a pasted address belongs to. Returns the
 * first family whose format matches, or null. (EVM/Tron/TON can overlap loosely;
 * the send flow only uses this as a hint when the address fails the active
 * family's check, so a close guess is fine.)
 */
export function detectAddressFamily (addr: string): ChainFamily | null {
  const a = addr.trim()
  for (const family of ['evm', 'tron', 'ton', 'bitcoin', 'solana'] as ChainFamily[]) {
    if (ADDRESS_RE[family].test(a)) return family
  }
  return null
}

export interface BridgeSignpost {
  /** The family the pasted address appears to belong to. */
  readonly detected: ChainFamily
  /** Suggested bridge provider. */
  readonly provider: string
  /** A short, user-facing explanation. */
  readonly note: string
  /** Optional link to the bridge. */
  readonly url?: string
}

/**
 * Route-aware signpost for moving value from `from` family to `to` family.
 * Returns null when same-family (no bridge needed — a normal send works).
 */
export function bridgeRouteFor (from: ChainFamily, to: ChainFamily): Omit<BridgeSignpost, 'detected'> | null {
  if (from === to) return null
  const key = [from, to].sort().join('+')

  switch (key) {
    case 'evm+solana':
      return {
        provider: 'Wormhole Portal',
        url: 'https://portalbridge.com',
        note: 'USDt and most assets move between EVM and Solana via Wormhole.'
      }
    case 'evm+tron':
      return {
        provider: 'a USDT bridge or exchange',
        note: 'Tron and EVM are separate networks; move USDt via a supported bridge or a centralized exchange.'
      }
    case 'evm+ton':
      return {
        provider: 'a TON bridge',
        url: 'https://ton.org/bridge',
        note: 'Use the TON bridge (or an exchange) to move assets between TON and EVM.'
      }
    case 'bitcoin+evm':
      return {
        provider: 'a wrapped-BTC bridge or exchange',
        note: 'Bitcoin does not bridge to EVM natively; use a wrapped-BTC route (e.g. tBTC) or an exchange.'
      }
    default:
      return {
        provider: 'a cross-chain bridge or exchange',
        note: `${FAMILY_LABEL[from]} and ${FAMILY_LABEL[to]} are separate networks — move funds via a bridge or a centralized exchange.`
      }
  }
}

/**
 * Given the active send family and a pasted recipient address, return a bridge
 * signpost IF the address belongs to a different, recognizable family. Returns
 * null when the address matches the active family (normal send) or is
 * unrecognizable (the caller shows its generic validation error).
 */
export function crossVmSignpost (activeFamily: ChainFamily, address: string): BridgeSignpost | null {
  if (isAddressForFamily(address, activeFamily)) return null
  const detected = detectAddressFamily(address)
  if (!detected || detected === activeFamily) return null
  const route = bridgeRouteFor(activeFamily, detected)
  if (!route) return null
  return { detected, ...route }
}
