import { NextResponse } from 'next/server'
import { appendSharedTip, SpendCapExceededError } from '@/lib/party-server'
import { normalizeRoomCode, type TipRecord } from '@/lib/party-types'

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

    const body = await req.json() as Partial<TipRecord>
    const nationId = body.nationId?.trim()
    const amount = body.amount?.trim()
    const symbol = body.symbol?.trim() || 'USDt'
    const hash = body.hash?.trim()
    const from = body.from?.trim()
    const ts = typeof body.ts === 'number' ? body.ts : Date.now()

    if (!nationId || !amount || !hash) {
      return NextResponse.json({ error: 'nationId, amount, and hash are required' }, { status: 400 })
    }
    if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
      return NextResponse.json({ error: 'Invalid tx hash' }, { status: 400 })
    }

    const tip: TipRecord = { nationId, amount, symbol, hash, ts, ...(from ? { from } : {}) }
    const party = await appendSharedTip(code, tip)
    if (!party) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }
    return NextResponse.json(party)
  } catch (e) {
    if (e instanceof SpendCapExceededError) {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Tip sync failed' },
      { status: 500 }
    )
  }
}
