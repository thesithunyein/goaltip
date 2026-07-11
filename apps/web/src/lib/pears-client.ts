/** Local Pears (Hyperswarm) sidecar — optional multi-track gossip for tips. */

const PEARS_URL = 'http://127.0.0.1:3848'
/** Second local swarm (pnpm demo) so Hyperswarm peer count is visible. */
const PEARS_PEER_B = 'http://127.0.0.1:3849'

export type PearsTip = {
  nationId: string
  amount: string
  hash: string
  from?: string
}

export async function pearsHealth (): Promise<{ ok: boolean, hyperswarm?: boolean }> {
  try {
    const res = await fetch(`${PEARS_URL}/health`, { signal: AbortSignal.timeout(1500) })
    if (!res.ok) return { ok: false }
    return await res.json() as { ok: boolean, hyperswarm?: boolean }
  } catch {
    return { ok: false }
  }
}

export async function pearsJoin (code: string): Promise<{ peers: number } | null> {
  try {
    const res = await fetch(`${PEARS_URL}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
      signal: AbortSignal.timeout(8000)
    })
    // Best-effort second local peer for demo peer count.
    void fetch(`${PEARS_PEER_B}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
      signal: AbortSignal.timeout(8000)
    }).catch(() => {})
    if (!res.ok) return null
    return await res.json() as { peers: number }
  } catch {
    return null
  }
}

export async function pearsAnnounce (code: string, tip: PearsTip): Promise<void> {
  try {
    await fetch(`${PEARS_URL}/announce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, tip }),
      signal: AbortSignal.timeout(4000)
    })
  } catch { /* optional */ }
}

export async function pearsStatus (code: string): Promise<{ peers: number, joined: boolean } | null> {
  try {
    const res = await fetch(`${PEARS_URL}/status/${encodeURIComponent(code)}`, {
      signal: AbortSignal.timeout(1500)
    })
    if (!res.ok) return null
    return await res.json() as { peers: number, joined: boolean }
  } catch {
    return null
  }
}

/** Tips gossiped over Hyperswarm (untrusted until party API verifies). */
export async function pearsTips (code: string): Promise<{ peers: number, tips: PearsTip[] } | null> {
  try {
    const res = await fetch(`${PEARS_URL}/tips/${encodeURIComponent(code)}`, {
      signal: AbortSignal.timeout(2000)
    })
    if (!res.ok) return null
    return await res.json() as { peers: number, tips: PearsTip[] }
  } catch {
    return null
  }
}
