'use client'

/* eslint-disable @next/next/no-img-element */

/**
 * LightningDialog — Spark / Lightning receive (create a BOLT11 invoice) and pay
 * (settle a BOLT11 invoice), driven through the worklet over Comlink. Spark is an
 * L2 account keyed inside the worker; this dialog only collects intent. The Spark
 * SDK loads lazily on first use (its own ~6.4 MB chunk) and connects over the
 * network, so the first open shows a "connecting" state. The invoice preview is
 * decoded locally with the engine's `decodeBolt11` before paying.
 */

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Button, Input } from '@wdk-starter/wdk-ui'
import { Modal } from './modal'
import { getWalletApi } from '@/wallet/wallet-client'
import { decodeBolt11 } from '@wdk-starter/wdk-web-core/payments'

type Tab = 'receive' | 'send'

export function LightningDialog ({ accountIndex, onClose }: { accountIndex: number, onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('receive')
  const [address, setAddress] = useState<string | null>(null)
  const [balance, setBalance] = useState<bigint | null>(null)
  const [status, setStatus] = useState<'connecting' | 'ready' | 'error'>('connecting')
  const [statusMsg, setStatusMsg] = useState('')

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
    <Modal title="⚡ Lightning" onClose={onClose}>
      {status === 'connecting' && <p style={note}>Connecting to Spark… (first use loads the Lightning module).</p>}
      {status === 'error' && <p style={err}>{statusMsg}</p>}
      {status === 'ready' && (
        <div style={col}>
          <div style={pill}>
            <span style={{ opacity: 0.7 }}>Spark balance</span>
            <strong>{balance !== null ? `${balance.toString()} sats` : '…'}</strong>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['receive', 'send'] as Tab[]).map((t) => (
              <Button key={t} size="sm" variant={tab === t ? 'primary' : 'secondary'} onClick={() => setTab(t)} style={{ flex: 1 }}>
                {t === 'receive' ? 'Receive' : 'Pay'}
              </Button>
            ))}
          </div>
          {tab === 'receive' ? <Receive accountIndex={accountIndex} /> : <Pay accountIndex={accountIndex} />}
          {address && <code style={addrCode} title="Your Spark address">{address}</code>}
        </div>
      )}
    </Modal>
  )
}

function Receive ({ accountIndex }: { accountIndex: number }) {
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
      <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (sats)" inputMode="numeric" />
      <Input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Memo (optional)" />
      {error && <p style={err}>{error}</p>}
      <Button onClick={create} disabled={busy} style={{ width: '100%' }}>{busy ? 'Creating…' : 'Create invoice'}</Button>
    </div>
  )
}

function Pay ({ accountIndex }: { accountIndex: number }) {
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
      </div>
    )
  }

  return (
    <div style={col}>
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

const col: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12 }
const note: React.CSSProperties = { margin: 0, color: 'var(--text-secondary, #b3a79f)', fontSize: 13, textAlign: 'center' }
const err: React.CSSProperties = { margin: 0, color: 'var(--color-error, #ef4444)', fontSize: 13 }
const pill: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13, padding: '8px 12px', borderRadius: 10, background: 'var(--bg-elevated-2, #241f1c)' }
const addrCode: React.CSSProperties = { wordBreak: 'break-all', fontSize: 11, color: 'var(--text-primary)', background: 'var(--bg-elevated-2, #241f1c)', padding: '8px 10px', borderRadius: 8, width: '100%' }
