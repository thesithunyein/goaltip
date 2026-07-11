import { NextResponse } from 'next/server'
import { getSharedParty } from '@/lib/party-server'
import { normalizeRoomCode } from '@/lib/party-types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET (
  _req: Request,
  ctx: { params: Promise<{ code: string }> }
): Promise<Response> {
  try {
    const { code: raw } = await ctx.params
    const code = normalizeRoomCode(raw)
    if (!code) {
      return NextResponse.json({ error: 'Invalid room code' }, { status: 400 })
    }
    // Reserved path segment — use /api/party/health or /api/health instead.
    if (code === 'HEALTH') {
      const redis = Boolean(
        process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
      )
      return NextResponse.json({
        ok: true,
        persistence: redis ? 'redis' : 'memory',
        tipVerification: 'sepolia-erc20-transfer',
        escrow: 'tippool-per-room',
        settle: 'on-chain-tippool+board',
        qvac: 'local-optional'
      })
    }
    const party = await getSharedParty(code)
    if (!party) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }
    return NextResponse.json(party)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Fetch failed' },
      { status: 500 }
    )
  }
}
