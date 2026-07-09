'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button, Card, Input } from '@wdk-starter/wdk-ui'
import { useWallet } from '@/wallet/wallet-provider'
import { getChain, parseAmount } from '@/wallet/chains'
import { encodeErc20Transfer } from '@/wallet/erc20'
import { getWalletApi } from '@/wallet/wallet-client'
import { tokensFor } from '@/wallet/tokens'
import { NATIONS, getNation, type Nation } from '@/lib/nations'
import {
  apiAppendTip,
  apiCreateParty,
  apiGetParty,
  clearParty,
  getParty,
  inviteUrl,
  nationTotals,
  normalizeRoomCode,
  setPartyCache,
  type WatchParty
} from '@/lib/party-store'
import { BrandHeader } from './brand-header'
import { NationFlag } from './nation-flag'
import { Screen } from './screen'

const CHAIN_ID = 'sepolia-testnet'
const TIP_PRESETS = ['1', '5', '10'] as const
const POLL_MS = 4000

export function WatchPartyScreen (): React.JSX.Element {
  const { address, accountIndex, phase } = useWallet()
  const [party, setParty] = useState<WatchParty | null>(null)
  const [nationA, setNationA] = useState('mm')
  const [nationB, setNationB] = useState('br')
  const [joinCode, setJoinCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customAmount, setCustomAmount] = useState('1')
  const [selectedNation, setSelectedNation] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [mode, setMode] = useState<'create' | 'join'>('create')

  const usdt = tokensFor(CHAIN_ID).find((t) => t.symbol === 'USDt')

  const applyParty = useCallback((p: WatchParty) => {
    setPartyCache(p)
    setParty(p)
  }, [])

  // Hydrate from local cache, then ?room=CODE, then refresh from API.
  // Old local-only rooms (pre-shared) are republished to the shared board.
  useEffect(() => {
    const cached = getParty()
    const params = new URLSearchParams(window.location.search)
    const room = params.get('room')

    const publishLocal = async (local: WatchParty): Promise<WatchParty | null> => {
      try {
        return await apiCreateParty({
          nationA: local.nationA,
          nationB: local.nationB,
          poolAddress: local.poolAddress,
          code: local.code
        })
      } catch {
        return null
      }
    }

    if (room) {
      setMode('join')
      setJoinCode(normalizeRoomCode(room))
      void (async () => {
        try {
          const remote = await apiGetParty(room)
          if (remote) {
            applyParty(remote)
            return
          }
          // Room code in URL but not on server — clear stale local cache for that code.
          if (cached && normalizeRoomCode(cached.code) === normalizeRoomCode(room)) {
            clearParty()
            setParty(null)
          }
          setError('Room not found on the shared board. Ask the host to Create a new shared room and send a fresh invite link.')
        } catch {
          setError('Could not reach the shared board. Check your connection and try Join again.')
        }
      })()
      return
    }

    if (cached) {
      void (async () => {
        try {
          const remote = await apiGetParty(cached.code)
          if (remote) {
            applyParty(remote)
            return
          }
          // Local-only legacy room: publish it so friends can join.
          const published = await publishLocal(cached)
          if (published) {
            applyParty(published)
            const url = new URL(window.location.href)
            url.searchParams.set('room', published.code)
            window.history.replaceState({}, '', url.toString())
            return
          }
          // Could not publish — leave room so user creates a fresh shared one.
          clearParty()
          setParty(null)
          setError('Your old room was local-only. Create a new shared room, then copy the invite link.')
        } catch {
          applyParty(cached)
        }
      })()
    }
  }, [applyParty])

  // Live poll while a party is open.
  useEffect(() => {
    if (!party?.code) return
    let cancelled = false
    const tick = async () => {
      try {
        const remote = await apiGetParty(party.code)
        if (!cancelled && remote) applyParty(remote)
      } catch {
        /* ignore transient poll errors */
      }
    }
    const id = window.setInterval(() => { void tick() }, POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [party?.code, applyParty])

  const startParty = useCallback(async () => {
    if (!address) return
    setBusy(true)
    setError(null)
    try {
      const p = await apiCreateParty({ nationA, nationB, poolAddress: address })
      applyParty(p)
      const url = new URL(window.location.href)
      url.searchParams.set('room', p.code)
      window.history.replaceState({}, '', url.toString())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create party.')
    } finally {
      setBusy(false)
    }
  }, [address, nationA, nationB, applyParty])

  const joinParty = useCallback(async () => {
    const code = normalizeRoomCode(joinCode)
    if (!code) {
      setError('Enter a room code.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const remote = await apiGetParty(code)
      if (!remote) {
        setError('Room not found on the shared board. Old local rooms do not work — host must Create a new shared room and send a fresh invite.')
        return
      }
      applyParty(remote)
      const url = new URL(window.location.href)
      url.searchParams.set('room', remote.code)
      window.history.replaceState({}, '', url.toString())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not join party.')
    } finally {
      setBusy(false)
    }
  }, [joinCode, applyParty])

  const copyInvite = useCallback(async () => {
    if (!party) return
    try {
      await navigator.clipboard.writeText(inviteUrl(party.code))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy invite link.')
    }
  }, [party])

  const refreshParty = useCallback(async () => {
    if (!party) return
    setSyncing(true)
    setError(null)
    try {
      const remote = await apiGetParty(party.code)
      if (remote) applyParty(remote)
      else setError('Room not found on server (may have expired).')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Refresh failed.')
    } finally {
      setSyncing(false)
    }
  }, [party, applyParty])

  const tipNation = useCallback(async (nationId: string, amountStr: string) => {
    if (!party || !usdt || phase !== 'unlocked' || !address) return
    setBusy(true)
    setError(null)
    setSelectedNation(nationId)
    try {
      const amountBase = parseAmount(amountStr, usdt.decimals)
      const api = getWalletApi()
      let usdtBalance: bigint | null = null
      try {
        usdtBalance = BigInt(await api.rpc_getTokenBalance(CHAIN_ID as never, address, usdt.address))
      } catch { /* balance read failed — let the send surface its own error */ }
      if (usdtBalance !== null && usdtBalance < amountBase) {
        setError(`Not enough test USDt (balance: ${(Number(usdtBalance) / 1e6).toFixed(2)}). Mint free USDT from the Aave Sepolia faucet — link in the card below.`)
        return
      }
      const hash = await api.account_sendTransaction(
        CHAIN_ID as never,
        accountIndex,
        { to: usdt.address, value: 0n, data: encodeErc20Transfer(party.poolAddress, amountBase) }
      )
      const tip = {
        nationId,
        amount: amountStr,
        symbol: 'USDt' as const,
        hash: hash as string,
        ts: Date.now()
      }
      // Optimistic local update, then sync to shared board.
      const local = setPartyCache({
        ...party,
        tips: [tip, ...party.tips.filter((t) => t.hash.toLowerCase() !== tip.hash.toLowerCase())]
      })
      setParty(local)
      try {
        const synced = await apiAppendTip(party.code, tip)
        applyParty(synced)
      } catch {
        setError('Tip sent on-chain, but shared board sync failed. Tap Refresh pool.')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tip failed.')
    } finally {
      setBusy(false)
      setSelectedNation(null)
    }
  }, [party, usdt, phase, accountIndex, address, applyParty])

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
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                variant={mode === 'create' ? 'primary' : 'outline'}
                onClick={() => { setMode('create'); setError(null) }}
                style={{ flex: 1 }}
              >
                Create
              </Button>
              <Button
                variant={mode === 'join' ? 'primary' : 'outline'}
                onClick={() => { setMode('join'); setError(null) }}
                style={{ flex: 1 }}
              >
                Join
              </Button>
            </div>

            {mode === 'create' ? (
              <>
                <h2 style={h2}>Start a watch party</h2>
                <p style={dim}>
                  Pick tonight&apos;s match, create a shared tipping room, and send friends the invite link.
                  Tips are self-custodial USDT on Sepolia via WDK — every device sees the same board.
                </p>
                <label style={field}>
                  <span style={label}>Home nation</span>
                  <NationSelect value={nationA} onChange={setNationA} exclude={nationB} />
                </label>
                <label style={field}>
                  <span style={label}>Away nation</span>
                  <NationSelect value={nationB} onChange={setNationB} exclude={nationA} />
                </label>
                <Button
                  onClick={() => void startParty()}
                  disabled={!address || nationA === nationB || busy}
                  style={{ width: '100%' }}
                >
                  {busy ? 'Creating…' : 'Create shared room'}
                </Button>
              </>
            ) : (
              <>
                <h2 style={h2}>Join a watch party</h2>
                <p style={dim}>
                  Enter the room code from a friend&apos;s invite. Old local-only rooms (from before shared boards) will not work — the host must Create a new shared room.
                </p>
                <label style={field}>
                  <span style={label}>Room code</span>
                  <Input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. 9UFZ1Y"
                    style={{ textTransform: 'uppercase', letterSpacing: 2 }}
                  />
                </label>
                <Button
                  onClick={() => void joinParty()}
                  disabled={busy || normalizeRoomCode(joinCode).length < 4}
                  style={{ width: '100%' }}
                >
                  {busy ? 'Joining…' : 'Join room'}
                </Button>
              </>
            )}
            {error && <p style={errorStyle}>{error}</p>}
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
            Shared rooms sync tip boards across devices.
          </p>
        </Card>
        <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span style={dim}>Room {party.code}</span>
            <span style={{ fontSize: 12, color: 'var(--wdk-orange, #f4642f)' }}>Shared · Sepolia</span>
          </div>
          <div style={matchRow}>
            <NationBadge nation={nationAInfo} total={totalA} />
            <span style={{ fontSize: 20, color: 'var(--text-secondary, var(--text-dim, #b3a79f))' }}>vs</span>
            <NationBadge nation={nationBInfo} total={totalB} />
          </div>
          <p style={{ ...dim, fontSize: 12, margin: 0 }}>
            Pool: {party.poolAddress.slice(0, 8)}…{party.poolAddress.slice(-6)}
          </p>
          <Button variant="secondary" onClick={() => void copyInvite()} style={{ width: '100%' }}>
            {copied ? 'Copied invite link' : 'Copy invite link'}
          </Button>
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
                  <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <NationFlag nation={n} size={22} /> {n.name}
                  </strong>
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
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Input value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} placeholder="Custom amount" style={{ flex: '1 1 120px' }} />
            <Button
              disabled={busy || !usdt || customAmount.trim() === ''}
              onClick={() => void tipNation(party.nationA, customAmount)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <NationFlag nation={nationAInfo} size={16} /> Tip
            </Button>
            <Button
              disabled={busy || !usdt || customAmount.trim() === ''}
              onClick={() => void tipNation(party.nationB, customAmount)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <NationFlag nation={nationBInfo} size={16} /> Tip
            </Button>
          </div>
          {error && <p style={errorStyle}>{error}</p>}
        </Card>

        <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 14 }}>Need test funds? (free, 1 min)</h3>
          <p style={{ ...dim, fontSize: 12 }}>
            1. <a href="https://www.alchemy.com/faucets/ethereum-sepolia" target="_blank" rel="noreferrer">Sepolia ETH faucet</a> — gas for transactions<br />
            2. <a href="https://app.aave.com/faucet/" target="_blank" rel="noreferrer">Aave faucet</a> (enable Testnet Mode in settings) — mint test USDT<br />
            3. Send both to your wallet address in the <strong>Wallet</strong> tab, then tip.
          </p>
        </Card>

        {party.tips.length > 0 && (
          <Card padding="lg">
            <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Recent tips (shared)</h3>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {party.tips.slice(0, 8).map((t) => {
                const n = getNation(t.nationId)
                return (
                  <li key={t.hash} style={tipRow}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <NationFlag nation={n} size={16} /> {n?.name} · {t.amount} {t.symbol}
                    </span>
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

        <Button variant="outline" onClick={() => void refreshParty()} disabled={syncing} style={{ width: '100%' }}>
          {syncing ? 'Refreshing…' : 'Refresh pool'}
        </Button>
        <Button variant="outline" onClick={() => {
          clearParty()
          setParty(null)
          const url = new URL(window.location.href)
          url.searchParams.delete('room')
          window.history.replaceState({}, '', url.pathname)
        }} style={{ width: '100%' }}>
          Leave room
        </Button>
      </div>
    </main>
  )
}

function NationSelect ({ value, onChange, exclude }: { value: string, onChange: (v: string) => void, exclude?: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={selectStyle}>
      {NATIONS.filter((n) => n.id !== exclude).map((n) => (
        <option key={n.id} value={n.id}>{n.name} ({n.iso.toUpperCase()})</option>
      ))}
    </select>
  )
}

function NationBadge ({ nation, total }: { nation?: Nation, total: number }) {
  if (!nation) return null
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
        <NationFlag nation={nation} size={40} />
      </div>
      <div style={{ fontWeight: 600 }}>{nation.name}</div>
      <div style={{ fontSize: 14, color: 'var(--wdk-orange, #f4642f)' }}>{total} USDt</div>
    </div>
  )
}

const page: React.CSSProperties = { minHeight: '100dvh', padding: '24px 16px', background: 'var(--bg-base, var(--bg))', color: 'var(--text-primary, var(--text))' }
const container: React.CSSProperties = { width: '100%', maxWidth: 460, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }
const h2: React.CSSProperties = { margin: 0, fontSize: 22, color: 'var(--text-primary, var(--text))' }
const dim: React.CSSProperties = { margin: 0, color: 'var(--text-secondary, var(--text-dim, #b3a79f))', fontSize: 14, lineHeight: 1.5 }
const field: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }
const label: React.CSSProperties = { fontSize: 13, color: 'var(--text-secondary, var(--text-dim, #b3a79f))' }
const matchRow: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }
const errorStyle: React.CSSProperties = { margin: 0, color: 'var(--color-error, #ef4444)', fontSize: 13 }
const tipRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--border-default, var(--border, #332c28))', color: 'var(--text-primary, var(--text))' }
const selectStyle: React.CSSProperties = {
  padding: '10px 12px', borderRadius: 8,
  border: '1px solid var(--border-default, var(--border, #332c28))',
  background: 'var(--bg-elevated-2, var(--surface-2, #241f1c))',
  color: 'var(--text-primary, var(--text, #f7eee8))', fontSize: 14
}
