import { NextResponse } from 'next/server'
import { createSharedParty } from '@/lib/party-server'
import { DeployVerificationError, verifyTipPoolDeploy } from '@/lib/verify-deploy-tx'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST (req: Request): Promise<Response> {
  try {
    const body = await req.json() as {
      nationA?: string
      nationB?: string
      poolAddress?: string
      hostAddress?: string
      escrowDeployTxHash?: string
      code?: string
      capPerWallet?: string
    }
    const nationA = body.nationA?.trim()
    const nationB = body.nationB?.trim()
    const poolAddress = body.poolAddress?.trim()
    const hostAddress = body.hostAddress?.trim()
    const escrowDeployTxHash = body.escrowDeployTxHash?.trim()
    const code = body.code?.trim()
    const capPerWallet = body.capPerWallet?.trim()
    if (!nationA || !nationB || !poolAddress || !hostAddress || !escrowDeployTxHash) {
      return NextResponse.json({
        error: 'nationA, nationB, poolAddress, hostAddress, and escrowDeployTxHash are required (TipPool escrow)'
      }, { status: 400 })
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(poolAddress)) {
      return NextResponse.json({ error: 'Invalid poolAddress' }, { status: 400 })
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(hostAddress)) {
      return NextResponse.json({ error: 'Invalid hostAddress' }, { status: 400 })
    }
    if (!/^0x[a-fA-F0-9]{64}$/.test(escrowDeployTxHash)) {
      return NextResponse.json({ error: 'Invalid escrowDeployTxHash' }, { status: 400 })
    }
    if (nationA === nationB) {
      return NextResponse.json({ error: 'Nations must differ' }, { status: 400 })
    }
    if (capPerWallet && (!Number.isFinite(Number.parseFloat(capPerWallet)) || Number.parseFloat(capPerWallet) <= 0)) {
      return NextResponse.json({ error: 'Spend limit must be a positive number' }, { status: 400 })
    }

    await verifyTipPoolDeploy({
      hash: escrowDeployTxHash,
      hostAddress,
      poolAddress
    })

    const party = await createSharedParty({
      nationA,
      nationB,
      poolAddress,
      hostAddress,
      escrowDeployTxHash,
      ...(code ? { code } : {}),
      ...(capPerWallet ? { capPerWallet } : {})
    })
    return NextResponse.json(party)
  } catch (e) {
    const status = e instanceof DeployVerificationError ? 400 : 500
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Create failed' },
      { status }
    )
  }
}
