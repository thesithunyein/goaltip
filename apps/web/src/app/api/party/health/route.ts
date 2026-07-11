import { NextResponse } from 'next/server'
import { probePersistence } from '@/lib/party-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Judge/ops probe: reports whether shared-room persistence is Redis-backed.
 * Does not expose credentials or create rooms.
 */
export async function GET (): Promise<Response> {
  const { persistence, redisError } = await probePersistence()
  return NextResponse.json({
    ok: persistence !== 'redis-error',
    persistence,
    ...(redisError ? { redisError } : {}),
    tipVerification: 'sepolia-erc20-transfer+tip-event',
    escrow: 'tippool-per-room',
    settle: 'on-chain-tippool+board',
    deployVerification: 'sepolia-receipt',
    qvac: 'local-optional',
    pears: 'local-optional'
  })
}
