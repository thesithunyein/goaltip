import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Top-level health probe (avoids clashing with /api/party/[code]).
 * Same payload as /api/party/health.
 */
export async function GET (): Promise<Response> {
  const redis = Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  )
  return NextResponse.json({
    ok: true,
    persistence: redis ? 'redis' : 'memory',
    tipVerification: 'sepolia-erc20-transfer+tip-event',
    escrow: 'tippool-per-room',
    settle: 'on-chain-tippool+board',
    qvac: 'local-optional',
    pears: 'local-optional'
  })
}
