import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Judge/ops probe: reports whether shared-room persistence is Redis-backed.
 * Does not expose credentials or create rooms.
 */
export async function GET (): Promise<Response> {
  const redis = Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  )
  return NextResponse.json({
    ok: true,
    persistence: redis ? 'redis' : 'memory',
    tipVerification: 'sepolia-erc20-transfer',
    settle: true
  })
}
