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
  apiSettleParty,
  clearParty,
  getParty,
  inviteUrl,
  nationTotals,
  normalizeRoomCode,
  remainingCap,
  setPartyCache,
  walletTotal,
  type WatchParty
} from '@/lib/party-store'
import {
  encodeErc20Approve,
  encodeTipPoolSettle,
  encodeTipPoolTip,
  waitForTxSuccess,
  getUsdtAllowance,
  partyHostAddress,
  tipPoolCreationData,
  waitForDeployedTipPool
} from '@/lib/tip-pool'
import { pearsAnnounce, pearsHealth, pearsJoin, pearsStatus } from '@/lib/pears-client'
import { BrandHeader } from './brand-header'
import { NationFlag } from './nation-flag'
import { Screen } from './screen'
import { softCardStyle, softContainer, softDim, softH2, softPage, softPillBtn } from '@/lib/soft-ui'

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
  const [capPerWallet, setCapPerWallet] = useState('10')
  const [capEnabled, setCapEnabled] = useState(true)
  const [ethWei, setEthWei] = useState<bigint | null>(null)
  const [escrowUsdt, setEscrowUsdt] = useState<string | null>(null)
  const [pearsPeers, setPearsPeers] = useState<number | null>(null)

  const usdt = tokensFor(CHAIN_ID).find((t) => t.symbol === 'USDt')

  // Need Sepolia ETH to deploy TipPool when creating a room.
  useEffect(() => {
    if (phase !== 'unlocked' || !address) {
      setEthWei(null)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const api = getWalletApi()
        const bal = BigInt(await api.rpc_getBalance(CHAIN_ID as never, address))
        if (!cancelled) setEthWei(bal)
      } catch {
        if (!cancelled) setEthWei(null)
      }
    })()
    return () => { cancelled = true }
  }, [phase, address, party])

  // Live TipPool USDt balance vs verified board totals.
  useEffect(() => {
    if (!party?.hostAddress || !usdt) {
      setEscrowUsdt(null)
      return
    }
    let cancelled = false
    const tick = async () => {
      try {
        const api = getWalletApi()
        const bal = BigInt(await api.rpc_getTokenBalance(CHAIN_ID as never, party.poolAddress, usdt.address))
        if (!cancelled) setEscrowUsdt((Number(bal) / 1e6).toFixed(2))
      } catch {
        /* ignore */
      }
    }
    void tick()
    const id = window.setInterval(() => { void tick() }, 8000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [party?.code, party?.poolAddress, party?.hostAddress, party?.tips.length, usdt])

  // Optional Pears Hyperswarm gossip (local sidecar).
  useEffect(() => {
    if (!party?.code) {
      setPearsPeers(null)
      return
    }
    let cancelled = false
    void (async () => {
      const health = await pearsHealth()
      if (!health.ok || cancelled) {
        if (!cancelled) setPearsPeers(null)
        return
      }
      await pearsJoin(party.code)
      const st = await pearsStatus(party.code)
      if (!cancelled) setPearsPeers(st?.peers ?? 0)
    })()
    const id = window.setInterval(() => {
      void pearsStatus(party.code).then((st) => {
        if (!cancelled && st) setPearsPeers(st.peers)
      })
    }, 5000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [party?.code])

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
      if (!local.hostAddress || !local.escrowDeployTxHash) {
        return null
      }
      try {
        return await apiCreateParty({
          nationA: local.nationA,
          nationB: local.nationB,
          poolAddress: local.poolAddress,
          code: local.code,
          hostAddress: local.hostAddress,
          escrowDeployTxHash: local.escrowDeployTxHash,
          ...(local.capPerWallet ? { capPerWallet: local.capPerWallet } : {})
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
    if (ethWei !== null && ethWei < 500_000_000_000_000n) {
      setError('Need a little Sepolia ETH for TipPool deploy gas. Use the Alchemy faucet link below, then try again.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const api = getWalletApi()
      // 1) Host deploys a TipPool escrow contract (USDt tips go here, not to the EOA).
      const deployHash = await api.account_sendTransaction(
        CHAIN_ID as never,
        accountIndex,
        { data: tipPoolCreationData() }
      )
      const poolAddress = await waitForDeployedTipPool(deployHash as string)
      // 2) Register the shared room with TipPool as pool + host EOA for settle.
      const p = await apiCreateParty({
        nationA,
        nationB,
        poolAddress,
        hostAddress: address,
        escrowDeployTxHash: deployHash as string,
        ...(capEnabled && capPerWallet.trim() ? { capPerWallet: capPerWallet.trim() } : {})
      })
      applyParty(p)
      const url = new URL(window.location.href)
      url.searchParams.set('room', p.code)
      window.history.replaceState({}, '', url.toString())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create party.')
    } finally {
      setBusy(false)
    }
  }, [address, accountIndex, nationA, nationB, capEnabled, capPerWallet, applyParty, ethWei])

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
    if (party.settledAt) {
      setError('This match is settled — tipping is locked.')
      return
    }
    setBusy(true)
    setError(null)
    setSelectedNation(nationId)
    try {
      const remaining = remainingCap(party, address)
      const wantAmount = Number.parseFloat(amountStr)
      if (remaining !== null && Number.isFinite(wantAmount) && wantAmount > remaining + 1e-9) {
        setError(
          remaining <= 0
            ? `You've hit this room's spend limit (${party.capPerWallet} USDt per wallet). No signing needed — the cap blocked it before any transaction.`
            : `That would exceed this room's spend limit. You have ${remaining.toFixed(2)} USDt left to tip.`
        )
        return
      }
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

      let hash: string
      if (party.hostAddress) {
        // TipPool.tip(nationId, amount) — nation tagged on-chain (approve once if needed).
        const allowance = await getUsdtAllowance(address, party.poolAddress)
        if (allowance < amountBase) {
          const approveHash = await api.account_sendTransaction(
            CHAIN_ID as never,
            accountIndex,
            { to: usdt.address, value: 0n, data: encodeErc20Approve(party.poolAddress) }
          )
          await waitForTxSuccess(approveHash as string, { label: 'USDt approve' })
        }
        hash = await api.account_sendTransaction(
          CHAIN_ID as never,
          accountIndex,
          { to: party.poolAddress, value: 0n, data: encodeTipPoolTip(nationId, amountBase) }
        ) as string
      } else {
        hash = await api.account_sendTransaction(
          CHAIN_ID as never,
          accountIndex,
          { to: usdt.address, value: 0n, data: encodeErc20Transfer(party.poolAddress, amountBase) }
        ) as string
      }
      const tip = {
        nationId,
        amount: amountStr,
        symbol: 'USDt' as const,
        hash: hash as string,
        ts: Date.now(),
        from: address,
        verified: false as const
      }
      // Optimistic local update, then sync to shared board (server verifies on-chain).
      const local = setPartyCache({
        ...party,
        tips: [tip, ...party.tips.filter((t) => t.hash.toLowerCase() !== tip.hash.toLowerCase())]
      })
      setParty(local)
      // Brief wait so Sepolia usually has a receipt before the verify poll starts.
      await new Promise((r) => setTimeout(r, 2000))
      try {
        const synced = await apiAppendTip(party.code, tip)
        applyParty(synced)
        void pearsAnnounce(party.code, {
          nationId: tip.nationId,
          amount: tip.amount,
          hash: tip.hash,
          from: tip.from
        })
      } catch (syncErr) {
        const msg = syncErr instanceof Error ? syncErr.message : 'shared board sync failed'
        setError(`Tip sent on-chain, but board verification failed: ${msg}. Tap Refresh pool.`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tip failed.')
    } finally {
      setBusy(false)
      setSelectedNation(null)
    }
  }, [party, usdt, phase, accountIndex, address, applyParty])

  const settleMatch = useCallback(async (winnerNationId: string) => {
    if (!party || !address) return
    if (address.toLowerCase() !== partyHostAddress(party)) {
      setError('Only the room host can settle this match.')
      return
    }
    if (!party.hostAddress) {
      setError('This room predates TipPool escrow. Create a new shared room.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const api = getWalletApi()
      const settleTxHash = await api.account_sendTransaction(
        CHAIN_ID as never,
        accountIndex,
        { to: party.poolAddress, value: 0n, data: encodeTipPoolSettle(winnerNationId) }
      ) as string
      await new Promise((r) => setTimeout(r, 2000))
      const settled = await apiSettleParty(party.code, {
        winnerNationId,
        from: address,
        settleTxHash
      })
      applyParty(settled)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Settle failed.')
    } finally {
      setBusy(false)
    }
  }, [party, address, accountIndex, applyParty])

  if (phase !== 'unlocked') {
    return (
      <Screen title="Watch Party">
        <Card padding="lg" variant="elevated" style={softCardStyle}><p style={softDim}>Unlock your wallet to join the watch party.</p></Card>
      </Screen>
    )
  }

  if (!party) {
    return (
      <main style={softPage}>
        <div style={softContainer}>
          <BrandHeader />
          <div style={{ textAlign: 'center', padding: '4px 0 2px' }}>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>Watch party</div>
            <h1 className="goaltip-party-hero" style={{ margin: 0, fontSize: 30, fontWeight: 750, letterSpacing: -0.6 }}>
              Tip your nation
            </h1>
          </div>
          <Card padding="md" variant="elevated" style={softCardStyle}>
            <div style={{ display: 'flex', gap: 8, padding: 4, borderRadius: 999, background: 'var(--bg-elevated-2)' }}>
              <Button
                variant={mode === 'create' ? 'primary' : 'ghost'}
                onClick={() => { setMode('create'); setError(null) }}
                style={{ flex: 1, ...softPillBtn }}
              >
                Create
              </Button>
              <Button
                variant={mode === 'join' ? 'primary' : 'ghost'}
                onClick={() => { setMode('join'); setError(null) }}
                style={{ flex: 1, ...softPillBtn }}
              >
                Join
              </Button>
            </div>

            {mode === 'create' ? (
              <>
                <h2 style={softH2}>Start a watch party</h2>
                <p style={softDim}>
                  Pick tonight&apos;s match. Creating a room deploys a TipPool escrow on Sepolia —
                  tips go to the contract (verified on-chain), not your EOA. Friends join by invite link.
                </p>
                <label style={field}>
                  <span style={label}>Home nation</span>
                  <NationSelect value={nationA} onChange={setNationA} exclude={nationB} />
                </label>
                <label style={field}>
                  <span style={label}>Away nation</span>
                  <NationSelect value={nationB} onChange={setNationB} exclude={nationA} />
                </label>
                <label style={{ ...field, gap: 8 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={capEnabled}
                      onChange={(e) => setCapEnabled(e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: 'var(--color-primary, #f4642f)' }}
                    />
                    <span style={label}>Spend limit per wallet (server-enforced before signing)</span>
                  </span>
                  {capEnabled && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Input
                        value={capPerWallet}
                        onChange={(e) => setCapPerWallet(e.target.value)}
                        placeholder="10"
                        inputMode="decimal"
                        style={{ flex: '0 0 100px', minHeight: 44, borderRadius: 14 }}
                      />
                      <span style={softDim}>USDt max per person</span>
                    </div>
                  )}
                </label>
                <Button
                  onClick={() => void startParty()}
                  disabled={!address || nationA === nationB || busy}
                  style={{ width: '100%', ...softPillBtn, minHeight: 48 }}
                >
                  {busy ? 'Deploying TipPool…' : 'Create shared room'}
                </Button>
                <p style={{ ...softDim, fontSize: 12 }}>
                  Needs Sepolia ETH for deploy gas.{' '}
                  <a href="https://www.alchemy.com/faucets/ethereum-sepolia" target="_blank" rel="noreferrer">Get faucet ETH</a>
                  {ethWei !== null && ethWei < 500_000_000_000_000n && (
                    <span style={{ color: 'var(--color-warning, #f59e0b)' }}> · Balance looks low</span>
                  )}
                </p>
              </>
            ) : (
              <>
                <h2 style={softH2}>Join a watch party</h2>
                <p style={softDim}>
                  Enter the room code from a friend&apos;s invite. Old local-only rooms will not work — the host must Create a new shared room.
                </p>
                <label style={field}>
                  <span style={label}>Room code</span>
                  <Input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. 9UFZ1Y"
                    style={{ textTransform: 'uppercase', letterSpacing: 2, borderRadius: 14, minHeight: 44 }}
                  />
                </label>
                <Button
                  onClick={() => void joinParty()}
                  disabled={busy || normalizeRoomCode(joinCode).length < 4}
                  style={{ width: '100%', ...softPillBtn, minHeight: 48 }}
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
  const myRemaining = address ? remainingCap(party, address) : null
  const myTipped = address ? walletTotal(party, address) : 0
  const isHost = Boolean(address && address.toLowerCase() === partyHostAddress(party))
  const isSettled = Boolean(party.settledAt)
  const winnerInfo = party.winnerNationId ? getNation(party.winnerNationId) : undefined
  const tipsLocked = isSettled
  const isEscrow = Boolean(party.hostAddress)
  const boardTotal = totalA + totalB
  const leadId = totalA === totalB ? null : (totalA > totalB ? party.nationA : party.nationB)

  return (
    <main style={softPage}>
      <div style={softContainer}>
        <BrandHeader />

        <div style={{ textAlign: 'center', padding: '6px 0 2px' }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Room {party.code} · Sepolia{isEscrow ? ' · TipPool' : ''}{party.capPerWallet ? ` · Cap ${party.capPerWallet}` : ''}{isSettled ? ' · Settled' : ''}{pearsPeers !== null ? ` · Pears ${pearsPeers}p` : ''}
          </div>
          {isEscrow && chain.explorer && (
            <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--text-secondary)' }}>
              Escrow{' '}
              <a href={`${chain.explorer}/address/${party.poolAddress}`} target="_blank" rel="noreferrer">
                {party.poolAddress.slice(0, 6)}…{party.poolAddress.slice(-4)}
              </a>
              {party.escrowDeployTxHash && (
                <>
                  {' · '}
                  <a href={`${chain.explorer}/tx/${party.escrowDeployTxHash}`} target="_blank" rel="noreferrer">deploy ↗</a>
                </>
              )}
              {party.settleTxHash && (
                <>
                  {' · '}
                  <a href={`${chain.explorer}/tx/${party.settleTxHash}`} target="_blank" rel="noreferrer">settle tx ↗</a>
                </>
              )}
            </p>
          )}
          <div style={matchRow}>
            <NationBadge nation={nationAInfo} total={totalA} winner={party.winnerNationId === party.nationA} />
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-tertiary)', flexShrink: 0 }}>vs</span>
            <NationBadge nation={nationBInfo} total={totalB} winner={party.winnerNationId === party.nationB} />
          </div>
          {isSettled && winnerInfo && (
            <p style={{ margin: '12px 0 0', fontSize: 14, color: 'var(--color-primary)', fontWeight: 700 }}>
              {winnerInfo.name} wins · board {boardTotal.toFixed(2)} USDt
              {party.settledAmountUsdt ? ` · escrow paid ${party.settledAmountUsdt}` : ''}
            </p>
          )}
          {isEscrow && !isSettled && (
            <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
              Escrow on-chain: {escrowUsdt ?? '…'} USDt · Board verified: {boardTotal.toFixed(2)} USDt
              {escrowUsdt !== null && Math.abs(Number.parseFloat(escrowUsdt) - boardTotal) < 0.011
                ? ' · matched'
                : ''}
            </p>
          )}
        </div>

        <div className="goaltip-action-pill" style={{ margin: '2px 4px 0' }}>
          <button type="button" onClick={() => void copyInvite()}>{copied ? 'Copied' : 'Copy invite'}</button>
          <button type="button" className="goaltip-plus" onClick={() => void refreshParty()} disabled={syncing} aria-label="Refresh pool">↻</button>
          <button
            type="button"
            onClick={() => {
              clearParty()
              setParty(null)
              const url = new URL(window.location.href)
              url.searchParams.delete('room')
              window.history.replaceState({}, '', url.pathname)
            }}
          >
            Leave
          </button>
        </div>

        <Card padding="md" variant="elevated" style={softCardStyle}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{tipsLocked ? 'Tipping locked' : 'Tip your nation'}</h3>
          {!usdt && <p style={errorStyle}>USDt is not configured for Sepolia.</p>}
          {party.capPerWallet && !tipsLocked && (
            <p style={{ ...softDim, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span aria-hidden style={{ color: 'var(--color-primary)' }}>●</span>
              Cap {party.capPerWallet} USDt/wallet — tipped {myTipped.toFixed(2)}, {myRemaining !== null ? myRemaining.toFixed(2) : '—'} left
            </p>
          )}
          {!tipsLocked && (
            <>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[party.nationA, party.nationB].map((id) => {
                  const n = getNation(id)
                  if (!n) return null
                  return (
                    <div key={id} className="goaltip-soft-card" style={{ flex: '1 1 140px', minWidth: 0, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <NationFlag nation={n} size={22} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.name}</span>
                      </strong>
                      {TIP_PRESETS.map((amt) => {
                        const overCap = myRemaining !== null && Number.parseFloat(amt) > myRemaining + 1e-9
                        return (
                          <Button
                            key={amt}
                            variant="secondary"
                            disabled={busy || !usdt || overCap}
                            onClick={() => void tipNation(id, amt)}
                            style={{ width: '100%', ...softPillBtn }}
                            title={overCap ? 'Would exceed this room\'s spend limit' : undefined}
                          >
                            {busy && selectedNation === id ? '…' : `Tip ${amt} USDt`}
                          </Button>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'stretch' }}>
                <Input value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} placeholder="Custom" inputMode="decimal" style={{ flex: '1 1 100px', minWidth: 0, minHeight: 44, borderRadius: 14 }} />
                <Button disabled={busy || !usdt || customAmount.trim() === ''} onClick={() => void tipNation(party.nationA, customAmount)} style={{ ...softPillBtn, display: 'inline-flex', alignItems: 'center', gap: 6, flex: '1 1 auto' }}>
                  <NationFlag nation={nationAInfo} size={16} /> Tip
                </Button>
                <Button disabled={busy || !usdt || customAmount.trim() === ''} onClick={() => void tipNation(party.nationB, customAmount)} style={{ ...softPillBtn, display: 'inline-flex', alignItems: 'center', gap: 6, flex: '1 1 auto' }}>
                  <NationFlag nation={nationBInfo} size={16} /> Tip
                </Button>
              </div>
            </>
          )}
          {error && <p style={errorStyle}>{error}</p>}
        </Card>

        {isHost && !isSettled && (
          <Card padding="md" variant="elevated" style={softCardStyle}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Settle match</h3>
            <p style={{ ...softDim, fontSize: 13 }}>
              Host only. Calls TipPool.settle on-chain, then locks the board.
              {leadId && (
                <> Suggested: <strong>{getNation(leadId)?.name}</strong> leads on verified tips.</>
              )}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button
                disabled={busy}
                variant={leadId === party.nationA ? 'primary' : 'secondary'}
                onClick={() => void settleMatch(party.nationA)}
                style={{ flex: 1, ...softPillBtn, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <NationFlag nation={nationAInfo} size={16} /> {nationAInfo?.name} wins
              </Button>
              <Button
                disabled={busy}
                variant={leadId === party.nationB ? 'primary' : 'secondary'}
                onClick={() => void settleMatch(party.nationB)}
                style={{ flex: 1, ...softPillBtn, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <NationFlag nation={nationBInfo} size={16} /> {nationBInfo?.name} wins
              </Button>
            </div>
          </Card>
        )}

        <Card padding="md" variant="elevated" style={{ ...softCardStyle, gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Need test funds?</h3>
          <p style={{ ...softDim, fontSize: 12 }}>
            1. <a href="https://www.alchemy.com/faucets/ethereum-sepolia" target="_blank" rel="noreferrer">Sepolia ETH faucet</a><br />
            2. <a href="https://app.aave.com/faucet/" target="_blank" rel="noreferrer">Aave faucet</a> (Testnet Mode) — mint USDT<br />
            3. Tip from the <strong>Party</strong> tab
          </p>
        </Card>

        {party.tips.length > 0 && (
          <Card padding="md" variant="elevated" style={softCardStyle}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Recent tips</h3>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {party.tips.slice(0, 8).map((t) => {
                const n = getNation(t.nationId)
                return (
                  <li key={t.hash} style={tipRow}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                      <NationFlag nation={n} size={16} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{n?.name} · {t.amount} {t.symbol}</span>
                      {t.verified
                        ? <span style={verifiedBadge}>Verified</span>
                        : <span style={pendingBadge}>Pending</span>}
                    </span>
                    {chain.explorer && (
                      <a href={`${chain.explorer}/tx/${t.hash}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, flexShrink: 0, padding: '6px 0 6px 8px' }}>
                        explorer ↗
                      </a>
                    )}
                  </li>
                )
              })}
            </ul>
          </Card>
        )}
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

function NationBadge ({ nation, total, winner }: { nation?: Nation, total: number, winner?: boolean }) {
  if (!nation) return null
  return (
    <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        <NationFlag nation={nation} size={40} />
      </div>
      <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {nation.name}{winner ? ' · Win' : ''}
      </div>
      <div style={{ fontSize: 22, fontWeight: 750, letterSpacing: -0.4, color: 'var(--color-primary)', marginTop: 2 }}>
        {total.toFixed(2)} <span style={{ fontSize: 13, fontWeight: 600 }}>USDt</span>
      </div>
    </div>
  )
}

const field: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }
const label: React.CSSProperties = { fontSize: 13, color: 'var(--text-secondary)' }
const matchRow: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 8 }
const errorStyle: React.CSSProperties = { margin: 0, color: 'var(--color-error, #ef4444)', fontSize: 13, lineHeight: 1.4 }
const tipRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 13, padding: '12px 0', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }
const verifiedBadge: React.CSSProperties = {
  flexShrink: 0,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.3,
  textTransform: 'uppercase',
  color: 'var(--color-primary, #f4642f)',
  border: '1px solid color-mix(in srgb, var(--color-primary, #f4642f) 35%, transparent)',
  borderRadius: 999,
  padding: '3px 8px',
  background: 'color-mix(in srgb, var(--color-primary, #f4642f) 8%, transparent)'
}
const pendingBadge: React.CSSProperties = {
  ...verifiedBadge,
  color: 'var(--text-secondary)',
  borderColor: 'var(--border-default)',
  background: 'var(--bg-elevated-2)'
}
const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px', borderRadius: 14,
  border: '1px solid var(--border-default)',
  background: 'var(--bg-elevated-2)',
  color: 'var(--text-primary)', fontSize: 16,
  minHeight: 44
}
