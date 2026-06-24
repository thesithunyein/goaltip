'use client'

/* eslint-disable @next/next/no-img-element */

/**
 * SparkDialog — the full Spark (Bitcoin L2) surface, driven through the worklet
 * over Comlink. Spark is its own chain (Lightspark statechains + FROST signing);
 * Lightning is a payment rail Spark settles natively, so it lives here as a tab
 * rather than as a separate "chain". The Spark SDK loads lazily on first use (its
 * own ~6.4 MB chunk) and connects over the network, so the first open shows a
 * "connecting" state.
 *
 * Two top-level tabs:
 *   • Spark    — native L2: Receive (your spark1… address), Send (Spark→Spark),
 *                Deposit (fund from Bitcoin L1), Withdraw (cooperative exit to BTC).
 *   • Lightning — BOLT11: Receive (create an invoice) and Pay (settle one).
 */

import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { Button, Input } from '@wdk-starter/wdk-ui'
import { Modal } from './modal'
import { getWalletApi } from '@/wallet/wallet-client'
import { decodeBolt11, isSparkAddress, isBitcoinAddress } from '@wdk-starter/wdk-web-core/payments'

const SPARK_PURPLE = '#7916FF'

type TopTab = 'spark' | 'lightning'
type SparkAction = 'receive' | 'send' | 'deposit' | 'withdraw'
type LnAction = 'receive' | 'pay'

export function SparkDialog ({ accountIndex, onClose }: { accountIndex: number, onClose: () => void }) {
  const [top, setTop] = useState<TopTab>('spark')
  const [address, setAddress] = useState<string | null>(null)
  const [balance, setBalance] = useState<bigint | null>(null)
  const [status, setStatus] = useState<'connecting' | 'ready' | 'error'>('connecting')
  const [statusMsg, setStatusMsg] = useState('')

  const refreshBalance = useMemo(() => async () => {
    try { const bal = await getWalletApi().account_getSparkBalance(accountIndex); setBalance(bal) } catch { /* balance optional */ }
  }, [accountIndex])

  // Initialise the Spark account: loads the SDK lazily + connects over the network.
  useEffect(() => {
    let off = false
    void (async () => {
      setStatus('connecting')
      try {
        const api = getWalletApi()
        const addr = await api.account_getSparkAddress(accountIndex)
        if (off) return
        setAddress(addr)
        setStatus('ready')
        try { const bal = await api.account_getSparkBalance(accountIndex); if (!off) setBalance(bal) } catch { /* balance optional */ }
      } catch (e) {
        if (off) return
        setStatus('error')
        setStatusMsg(e instanceof Error ? e.message : 'Could not connect to Spark.')
      }
    })()
    return () => { off = true }
  }, [accountIndex])

  return (
    <Modal title="Spark" onClose={onClose}>
      <div style={col}>
        <BrandRow />

        {status === 'connecting' && <p style={note}>Connecting to Spark… (first use loads the Spark module).</p>}
        {status === 'error' && <p style={err}>{statusMsg}</p>}

        {status === 'ready' && (
          <>
            <div style={pill}>
              <span style={{ opacity: 0.7 }}>Spark balance</span>
              <strong>{balance !== null ? `${balance.toString()} sats` : '…'}</strong>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <TopTabButton active={top === 'spark'} onClick={() => setTop('spark')} icon="/spark.svg" label="Spark" />
              <TopTabButton active={top === 'lightning'} onClick={() => setTop('lightning')} icon="/lightning.png" label="Lightning" />
            </div>

            {top === 'spark'
              ? <SparkPane accountIndex={accountIndex} address={address} onChanged={refreshBalance} />
              : <LightningPane accountIndex={accountIndex} />}
          </>
        )}
      </div>
    </Modal>
  )
}

function BrandRow () {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <img src="/spark.svg" alt="" width={28} height={28} style={{ borderRadius: 8 }} />
      <div style={{ lineHeight: 1.1 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Spark</div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary, #b3a79f)' }}>Bitcoin L2 · Lightning-native</div>
      </div>
    </div>
  )
}

function TopTabButton ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: string, label: string }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
      padding: '9px 10px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600,
      border: active ? `1px solid ${SPARK_PURPLE}` : '1px solid var(--border-subtle, var(--border))',
      background: active ? 'rgba(121,22,255,0.12)' : 'var(--bg-elevated-2, #241f1c)',
      color: 'var(--text-primary)'
    }}>
      <img src={icon} alt="" width={18} height={18} />
      {label}
    </button>
  )
}

// ───────────────────────────── Spark (native L2) ────────────────────────────

function SparkPane ({ accountIndex, address, onChanged }: { accountIndex: number, address: string | null, onChanged: () => void }) {
  const [action, setAction] = useState<SparkAction>('receive')
  return (
    <div style={col}>
      <Segmented
        options={[['receive', 'Receive'], ['send', 'Send'], ['deposit', 'Deposit'], ['withdraw', 'Withdraw']]}
        value={action}
        onChange={(v) => setAction(v as SparkAction)}
      />
      {action === 'receive' && <SparkReceive address={address} />}
      {action === 'send' && <SparkSend accountIndex={accountIndex} onChanged={onChanged} />}
      {action === 'deposit' && <SparkDeposit accountIndex={accountIndex} />}
      {action === 'withdraw' && <SparkWithdraw accountIndex={accountIndex} onChanged={onChanged} />}
    </div>
  )
}

function SparkReceive ({ address }: { address: string | null }) {
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!address) { setQr(''); return }
    QRCode.toDataURL(address, { margin: 1, width: 200 }).then(setQr).catch(() => setQr(''))
  }, [address])
  async function copy () {
    if (!address) return
    await navigator.clipboard.writeText(address)
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }
  if (!address) return <p style={note}>Deriving your Spark address…</p>
  return (
    <div style={{ ...col, alignItems: 'center' }}>
      <p style={note}>Your Spark address — receive sats from any Spark wallet.</p>
      {qr && <img src={qr} alt="Spark address QR" width={200} height={200} style={{ borderRadius: 12, background: '#fff', padding: 6 }} />}
      <code style={addrCode}>{address}</code>
      <Button onClick={copy} style={{ width: '100%' }}>{copied ? 'Copied ✓' : 'Copy Spark address'}</Button>
    </div>
  )
}

function SparkSend ({ accountIndex, onChanged }: { accountIndex: number, onChanged: () => void }) {
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const toValid = to.trim() === '' || isSparkAddress(to.trim())

  async function send () {
    setError(null)
    const dest = to.trim()
    if (!isSparkAddress(dest)) { setError('Enter a valid Spark address (spark1…).'); return }
    const sats = Number(amount)
    if (!Number.isInteger(sats) || sats <= 0) { setError('Enter an amount in whole sats.'); return }
    setBusy(true)
    try {
      const hash = await getWalletApi().account_sendSparkTransaction(accountIndex, dest, BigInt(sats))
      setDone(hash); onChanged()
    } catch (e) { setError(e instanceof Error ? e.message : 'Send failed.') } finally { setBusy(false) }
  }

  if (done) {
    return (
      <div style={col}>
        <p style={{ margin: 0, textAlign: 'center' }}>✅ Sent.</p>
        <code style={addrCode}>{done}</code>
        <Button variant="secondary" onClick={() => { setDone(null); setTo(''); setAmount('') }} style={{ width: '100%' }}>Send again</Button>
      </div>
    )
  }
  return (
    <div style={col}>
      <p style={note}>Send sats instantly to another Spark address.</p>
      <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Recipient Spark address (spark1…)" />
      {!toValid && <p style={err}>Not a valid Spark address.</p>}
      <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (sats)" inputMode="numeric" />
      {error && <p style={err}>{error}</p>}
      <Button onClick={send} disabled={busy} style={{ width: '100%' }}>{busy ? 'Sending…' : 'Send sats'}</Button>
    </div>
  )
}

function SparkDeposit ({ accountIndex }: { accountIndex: number }) {
  const [addr, setAddr] = useState<string | null>(null)
  const [qr, setQr] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function load () {
    setError(null); setBusy(true)
    try {
      const a = await getWalletApi().account_getSparkDepositAddress(accountIndex)
      setAddr(a)
      QRCode.toDataURL(a, { margin: 1, width: 200 }).then(setQr).catch(() => setQr(''))
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not get a deposit address.') } finally { setBusy(false) }
  }

  async function copy () {
    if (!addr) return
    await navigator.clipboard.writeText(addr)
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  if (!addr) {
    return (
      <div style={col}>
        <p style={note}>Fund your Spark balance from Bitcoin L1. Generate a reusable deposit address, then send BTC to it — it credits your Spark balance after the on-chain deposit confirms.</p>
        {error && <p style={err}>{error}</p>}
        <Button onClick={load} disabled={busy} style={{ width: '100%' }}>{busy ? 'Getting address…' : 'Get Bitcoin deposit address'}</Button>
      </div>
    )
  }
  return (
    <div style={{ ...col, alignItems: 'center' }}>
      <p style={note}>Send BTC (Bitcoin L1) to this address to top up Spark. Reusable.</p>
      {qr && <img src={qr} alt="Bitcoin deposit QR" width={200} height={200} style={{ borderRadius: 12, background: '#fff', padding: 6 }} />}
      <code style={addrCode}>{addr}</code>
      <Button onClick={copy} style={{ width: '100%' }}>{copied ? 'Copied ✓' : 'Copy deposit address'}</Button>
    </div>
  )
}

const EXIT_SPEEDS: Array<['FAST' | 'MEDIUM' | 'SLOW', string]> = [['FAST', 'Fast'], ['MEDIUM', 'Medium'], ['SLOW', 'Slow']]

function SparkWithdraw ({ accountIndex, onChanged }: { accountIndex: number, onChanged: () => void }) {
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [speed, setSpeed] = useState<'FAST' | 'MEDIUM' | 'SLOW'>('MEDIUM')
  const [quote, setQuote] = useState<{ totalFeeSats: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ id: string, status: string | null } | null>(null)

  const toValid = to.trim() === '' || isBitcoinAddress(to.trim())

  async function getQuote () {
    setError(null); setQuote(null)
    const dest = to.trim()
    if (!isBitcoinAddress(dest)) { setError('Enter a valid Bitcoin address.'); return }
    const sats = Number(amount)
    if (!Number.isInteger(sats) || sats <= 0) { setError('Enter an amount in whole sats.'); return }
    setBusy(true)
    try {
      const q = await getWalletApi().account_quoteSparkWithdraw(accountIndex, dest, sats, speed)
      setQuote({ totalFeeSats: q.totalFeeSats })
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not get a fee quote.') } finally { setBusy(false) }
  }

  async function withdraw () {
    setError(null)
    const dest = to.trim()
    const sats = Number(amount)
    setBusy(true)
    try {
      const r = await getWalletApi().account_sparkWithdraw(accountIndex, dest, sats, speed)
      setDone({ id: r.id, status: r.status }); onChanged()
    } catch (e) { setError(e instanceof Error ? e.message : 'Withdrawal failed.') } finally { setBusy(false) }
  }

  if (done) {
    return (
      <div style={col}>
        <p style={{ margin: 0, textAlign: 'center' }}>✅ Withdrawal submitted.</p>
        <p style={note}>Cooperative exit to Bitcoin L1{done.status ? ` · ${done.status}` : ''}. Funds settle once the exit transaction confirms.</p>
        <code style={addrCode}>{done.id}</code>
        <Button variant="secondary" onClick={() => { setDone(null); setQuote(null); setTo(''); setAmount('') }} style={{ width: '100%' }}>Withdraw again</Button>
      </div>
    )
  }
  return (
    <div style={col}>
      <p style={note}>Withdraw sats from Spark to a Bitcoin L1 address (cooperative exit).</p>
      <Input value={to} onChange={(e) => { setTo(e.target.value); setQuote(null) }} placeholder="Bitcoin address (bc1… / 1… / 3…)" />
      {!toValid && <p style={err}>Not a valid Bitcoin address.</p>}
      <Input value={amount} onChange={(e) => { setAmount(e.target.value); setQuote(null) }} placeholder="Amount (sats)" inputMode="numeric" />
      <Segmented options={EXIT_SPEEDS} value={speed} onChange={(v) => { setSpeed(v as 'FAST' | 'MEDIUM' | 'SLOW'); setQuote(null) }} />
      {quote && (
        <div style={pill}>
          <span style={{ opacity: 0.7 }}>Network fee</span>
          <strong>{quote.totalFeeSats} sats</strong>
        </div>
      )}
      {error && <p style={err}>{error}</p>}
      {quote
        ? <Button onClick={withdraw} disabled={busy} style={{ width: '100%' }}>{busy ? 'Withdrawing…' : `Confirm withdraw · fee ${quote.totalFeeSats} sats`}</Button>
        : <Button onClick={getQuote} disabled={busy} variant="secondary" style={{ width: '100%' }}>{busy ? 'Quoting…' : 'Get fee quote'}</Button>}
    </div>
  )
}

// ───────────────────────────── Lightning (BOLT11) ───────────────────────────

function LightningPane ({ accountIndex }: { accountIndex: number }) {
  const [action, setAction] = useState<LnAction>('receive')
  return (
    <div style={col}>
      <Segmented options={[['receive', 'Receive'], ['pay', 'Pay']]} value={action} onChange={(v) => setAction(v as LnAction)} />
      {action === 'receive' ? <LightningReceive accountIndex={accountIndex} /> : <LightningPay accountIndex={accountIndex} />}
    </div>
  )
}

function LightningReceive ({ accountIndex }: { accountIndex: number }) {
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [invoice, setInvoice] = useState<string | null>(null)
  const [qr, setQr] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!invoice) { setQr(''); return }
    QRCode.toDataURL(invoice.toUpperCase(), { margin: 1, width: 200 }).then(setQr).catch(() => setQr(''))
  }, [invoice])

  async function create () {
    setError(null)
    const sats = Number(amount)
    if (!Number.isInteger(sats) || sats <= 0) { setError('Enter an amount in whole sats.'); return }
    setBusy(true)
    try {
      const inv = await getWalletApi().lightning_createInvoice(accountIndex, sats, memo || undefined)
      setInvoice(inv)
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not create invoice.') } finally { setBusy(false) }
  }

  async function copy () {
    if (!invoice) return
    await navigator.clipboard.writeText(invoice)
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  if (invoice) {
    return (
      <div style={{ ...col, alignItems: 'center' }}>
        {qr && <img src={qr} alt="Lightning invoice QR" width={200} height={200} style={{ borderRadius: 12, background: '#fff', padding: 6 }} />}
        <code style={addrCode}>{invoice}</code>
        <Button onClick={copy} style={{ width: '100%' }}>{copied ? 'Copied ✓' : 'Copy invoice'}</Button>
        <Button variant="secondary" onClick={() => setInvoice(null)} style={{ width: '100%' }}>New invoice</Button>
      </div>
    )
  }
  return (
    <div style={col}>
      <p style={note}>Create a BOLT11 invoice — payable from any Lightning wallet.</p>
      <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (sats)" inputMode="numeric" />
      <Input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Memo (optional)" />
      {error && <p style={err}>{error}</p>}
      <Button onClick={create} disabled={busy} style={{ width: '100%' }}>{busy ? 'Creating…' : 'Create invoice'}</Button>
    </div>
  )
}

function LightningPay ({ accountIndex }: { accountIndex: number }) {
  const [invoice, setInvoice] = useState('')
  const [maxFee, setMaxFee] = useState('10')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const decoded = invoice.trim() ? decodeBolt11(invoice.trim()) : null

  async function pay () {
    setError(null)
    if (!decoded) { setError('Paste a valid BOLT11 invoice (ln…).'); return }
    const fee = Number(maxFee)
    if (!Number.isInteger(fee) || fee < 0) { setError('Max fee must be a whole number of sats.'); return }
    setBusy(true)
    try {
      const id = await getWalletApi().lightning_payInvoice(accountIndex, invoice.trim(), fee)
      setDone(id)
    } catch (e) { setError(e instanceof Error ? e.message : 'Payment failed.') } finally { setBusy(false) }
  }

  if (done) {
    return (
      <div style={col}>
        <p style={{ margin: 0, textAlign: 'center' }}>✅ Payment sent.</p>
        <code style={addrCode}>{done}</code>
        <Button variant="secondary" onClick={() => { setDone(null); setInvoice('') }} style={{ width: '100%' }}>Pay another</Button>
      </div>
    )
  }
  return (
    <div style={col}>
      <p style={note}>Pay a BOLT11 invoice from your Spark balance.</p>
      <Input value={invoice} onChange={(e) => setInvoice(e.target.value)} placeholder="Paste a BOLT11 invoice (lnbc…)" />
      {decoded && (
        <div style={pill}>
          <span style={{ opacity: 0.7 }}>{decoded.network}</span>
          <strong>{decoded.millisatoshis !== undefined ? `${(decoded.millisatoshis / 1000n).toString()} sats` : 'Any amount'}</strong>
        </div>
      )}
      <Input value={maxFee} onChange={(e) => setMaxFee(e.target.value)} placeholder="Max fee (sats)" inputMode="numeric" />
      {error && <p style={err}>{error}</p>}
      <Button onClick={pay} disabled={busy || !decoded} style={{ width: '100%' }}>{busy ? 'Paying…' : 'Pay invoice'}</Button>
    </div>
  )
}

// ─────────────────────────────── shared bits ────────────────────────────────

function Segmented ({ options, value, onChange }: { options: Array<[string, string]>, value: string, onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {options.map(([v, label]) => (
        <Button key={v} size="sm" variant={value === v ? 'primary' : 'secondary'} onClick={() => onChange(v)} style={{ flex: 1 }}>
          {label}
        </Button>
      ))}
    </div>
  )
}

const col: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12 }
const note: React.CSSProperties = { margin: 0, color: 'var(--text-secondary, #b3a79f)', fontSize: 13, textAlign: 'center' }
const err: React.CSSProperties = { margin: 0, color: 'var(--color-error, #ef4444)', fontSize: 13 }
const pill: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13, padding: '8px 12px', borderRadius: 10, background: 'var(--bg-elevated-2, #241f1c)' }
const addrCode: React.CSSProperties = { wordBreak: 'break-all', fontSize: 11, color: 'var(--text-primary)', background: 'var(--bg-elevated-2, #241f1c)', padding: '8px 10px', borderRadius: 8, width: '100%' }
