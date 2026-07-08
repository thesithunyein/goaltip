'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button, Card, Input } from '@wdk-starter/wdk-ui'
import { useWallet } from '@/wallet/wallet-provider'
import { getChain, parseAmount } from '@/wallet/chains'
import { encodeErc20Transfer } from '@/wallet/erc20'
import { getWalletApi } from '@/wallet/wallet-client'
import { tokensFor } from '@/wallet/tokens'
import { NATIONS, getNation } from '@/lib/nations'
import {
  clearParty, createParty, getParty, recordTip, updateParty, nationTotals, type WatchParty
} from '@/lib/party-store'
import { BrandHeader } from './brand-header'
import { Screen } from './screen'

const CHAIN_ID = 'sepolia-testnet'
const TIP_PRESETS = ['1', '5', '10'] as const

export function WatchPartyScreen (): React.JSX.Element {
  const { address, accountIndex, phase } = useWallet()
  const [party, setParty] = useState<WatchParty | null>(null)
  const [nationA, setNationA] = useState('mm')
  const [nationB, setNationB] = useState('br')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customAmount, setCustomAmount] = useState('1')
  const [selectedNation, setSelectedNation] = useState<string | null>(null)

  useEffect(() => {
    setParty(getParty())
  }, [])

  const usdt = tokensFor(CHAIN_ID).find((t) => t.symbol === 'USDt')

  const startParty = useCallback(() => {
    if (!address) return
    const p = createParty({ nationA, nationB, poolAddress: address })
    setParty(p)
    setError(null)
  }, [address, nationA, nationB])

  const tipNation = useCallback(async (nationId: string, amountStr: string) => {
    if (!party || !usdt || phase !== 'unlocked') return
    setBusy(true)
    setError(null)
    setSelectedNation(nationId)
    try {
      const amountBase = parseAmount(amountStr, usdt.decimals)
      const hash = await getWalletApi().account_sendTransaction(
        CHAIN_ID as never,
        accountIndex,
        { to: usdt.address, value: 0n, data: encodeErc20Transfer(party.poolAddress, amountBase) }
      )
      const updated = recordTip({
        nationId,
        amount: amountStr,
        symbol: 'USDt',
        hash: hash as string,
        ts: Date.now()
      })
      if (updated) setParty(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tip failed.')
    } finally {
      setBusy(false)
      setSelectedNation(null)
    }
  }, [party, usdt, phase, accountIndex])

  if (phase !== 'unlocked') {
    return (
      <Screen title="Watch Party">
        <Card padding="lg"><p style={dim}>Unlock your wallet to join the watch party.</p></Card>
      </Screen>
    )
  }

  if (!party) {
    return (
      <main style={page}>
        <div style={container}>
          <BrandHeader />
          <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 style={h2}>Start a watch party</h2>
            <p style={dim}>
              Pick tonight&apos;s match, create a tipping pool, and rally fans for your nation.
              Tips are self-custodial USDT on Sepolia testnet via WDK.
            </p>
            <label style={field}>
              <span style={label}>Home nation</span>
              <NationSelect value={nationA} onChange={setNationA} exclude={nationB} />
            </label>
            <label style={field}>
              <span style={label}>Away nation</span>
              <NationSelect value={nationB} onChange={setNationB} exclude={nationA} />
            </label>
            <Button onClick={startParty} disabled={!address || nationA === nationB} style={{ width: '100%' }}>
              Create watch party
            </Button>
          </Card>
        </div>
      </main>
    )
  }

  const nationAInfo = getNation(party.nationA)
  const nationBInfo = getNation(party.nationB)
  const totals = nationTotals(party)
  const totalA = totals.get(party.nationA) ?? 0
  const totalB = totals.get(party.nationB) ?? 0
  const chain = getChain(CHAIN_ID)

  return (
    <main style={page}>
      <div style={container}>
        <BrandHeader />
        <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h1 style={{ margin: 0, fontSize: 28, letterSpacing: -0.5 }}>GoalTip</h1>
          <p style={dim}>
            Self-custodial USDt tipping for football watch parties. WDK keeps signing inside the browser worklet.
          </p>
        </Card>
        <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={dim}>Room {party.code}</span>
            <span style={{ fontSize: 12, color: 'var(--wdk-orange, #f4642f)' }}>Sepolia testnet</span>
          </div>
          <div style={matchRow}>
            <NationBadge nation={nationAInfo} total={totalA} />
            <span style={{ fontSize: 20, color: 'var(--text-dim, #b3a79f)' }}>vs</span>
            <NationBadge nation={nationBInfo} total={totalB} />
          </div>
          <p style={{ ...dim, fontSize: 12, margin: 0 }}>
            Pool: {party.poolAddress.slice(0, 8)}…{party.poolAddress.slice(-6)}
          </p>
        </Card>

        <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Tip your nation (USDt)</h3>
          {!usdt && <p style={errorStyle}>USDt is not configured for Sepolia. Open the Wallet tab and use native test ETH send as a fallback demo.</p>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[party.nationA, party.nationB].map((id) => {
              const n = getNation(id)
              if (!n) return null
              return (
                <div key={id} style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <strong>{n.flag} {n.name}</strong>
                  {TIP_PRESETS.map((amt) => (
                    <Button
                      key={amt}
                      variant="secondary"
                      disabled={busy || !usdt}
                      onClick={() => void tipNation(id, amt)}
                      style={{ width: '100%' }}
                    >
                      {busy && selectedNation === id ? '…' : `Tip ${amt} USDt`}
                    </Button>
                  ))}
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Input value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} placeholder="Amount" />
            <Button
              disabled={busy || !usdt}
              onClick={() => void tipNation(party.nationA, customAmount)}
            >
              Tip home
            </Button>
          </div>
          {error && <p style={errorStyle}>{error}</p>}
        </Card>

        {party.tips.length > 0 && (
          <Card padding="lg">
            <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Recent tips</h3>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {party.tips.slice(0, 8).map((t) => {
                const n = getNation(t.nationId)
                return (
                  <li key={t.hash} style={tipRow}>
                    <span>{n?.flag} {n?.name} · {t.amount} {t.symbol}</span>
                    {chain.explorer && (
                      <a href={`${chain.explorer}/tx/${t.hash}`} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
                        explorer ↗
                      </a>
                    )}
                  </li>
                )
              })}
            </ul>
          </Card>
        )}

        <Button variant="outline" onClick={() => {
          if (address) updateParty({ nationA, nationB, poolAddress: address })
          setParty(getParty())
        }} style={{ width: '100%' }}>
          Refresh pool
        </Button>
        <Button variant="outline" onClick={() => {
          clearParty()
          setParty(null)
        }} style={{ width: '100%' }}>
          Reset demo room
        </Button>
      </div>
    </main>
  )
}

function NationSelect ({ value, onChange, exclude }: { value: string, onChange: (v: string) => void, exclude?: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={selectStyle}>
      {NATIONS.filter((n) => n.id !== exclude).map((n) => (
        <option key={n.id} value={n.id}>{n.flag} {n.name}</option>
      ))}
    </select>
  )
}

function NationBadge ({ nation, total }: { nation?: { flag: string, name: string }, total: number }) {
  if (!nation) return null
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ fontSize: 36 }}>{nation.flag}</div>
      <div style={{ fontWeight: 600 }}>{nation.name}</div>
      <div style={{ fontSize: 14, color: 'var(--wdk-orange, #f4642f)' }}>{total} USDt</div>
    </div>
  )
}

const page: React.CSSProperties = { minHeight: '100dvh', padding: '24px 16px' }
const container: React.CSSProperties = { width: '100%', maxWidth: 460, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }
const h2: React.CSSProperties = { margin: 0, fontSize: 22 }
const dim: React.CSSProperties = { margin: 0, color: 'var(--text-dim, #b3a79f)', fontSize: 14, lineHeight: 1.5 }
const field: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }
const label: React.CSSProperties = { fontSize: 13, color: 'var(--text-dim, #b3a79f)' }
const matchRow: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }
const errorStyle: React.CSSProperties = { margin: 0, color: '#ef4444', fontSize: 13 }
const tipRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--border, #332c28)' }
const selectStyle: React.CSSProperties = {
  padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border, #332c28)',
  background: 'var(--surface-2, #241f1c)', color: 'var(--text, #f7eee8)', fontSize: 14
}
