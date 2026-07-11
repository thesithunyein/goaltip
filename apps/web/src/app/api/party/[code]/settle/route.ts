import { NextResponse } from 'next/server'
import { settleSharedParty, SettleForbiddenError, getSharedParty } from '@/lib/party-server'
import { normalizeRoomCode } from '@/lib/party-types'
import { partyHostAddress } from '@/lib/tip-pool'
import { SettleVerificationError, verifySettleTransaction } from '@/lib/verify-settle-tx'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST (
  req: Request,
  ctx: { params: Promise<{ code: string }> }
): Promise<Response> {
  try {
    const { code: raw } = await ctx.params
    const code = normalizeRoomCode(raw)
    if (!code) {
      return NextResponse.json({ error: 'Invalid room code' }, { status: 400 })
    }

    const body = await req.json() as {
      winnerNationId?: string
      from?: string
      settleTxHash?: string
    }
    const winnerNationId = body.winnerNationId?.trim()
    const from = body.from?.trim()
    const settleTxHash = body.settleTxHash?.trim()

    if (!winnerNationId || !from) {
      return NextResponse.json({ error: 'winnerNationId and from are required' }, { status: 400 })
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(from)) {
      return NextResponse.json({ error: 'Invalid host address' }, { status: 400 })
    }

    const existing = await getSharedParty(code)
    if (!existing) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Escrow rooms (TipPool) require an on-chain settle tx before the board locks.
    if (existing.hostAddress) {
      if (!settleTxHash || !/^0x[a-fA-F0-9]{64}$/.test(settleTxHash)) {
        return NextResponse.json({ error: 'settleTxHash is required for TipPool escrow rooms' }, { status: 400 })
      }
      await verifySettleTransaction({
        hash: settleTxHash,
        poolAddress: existing.poolAddress,
        hostAddress: partyHostAddress(existing),
        winnerNationId
      })
    }

    const party = await settleSharedParty(code, {
      winnerNationId,
      from,
      ...(settleTxHash ? { settleTxHash } : {})
    })
    if (!party) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }
    return NextResponse.json(party)
  } catch (e) {
    if (e instanceof SettleForbiddenError) {
      return NextResponse.json({ error: e.message }, { status: 403 })
    }
    if (e instanceof SettleVerificationError) {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Settle failed' },
      { status: 400 }
    )
  }
}
