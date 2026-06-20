'use client'

/**
 * BuyDialog — MoonPay fiat on-ramp for the template, via the worklet over
 * Comlink. Template standard: activates from the app's own publishable key
 * (NEXT_PUBLIC_MOONPAY_API_KEY); with no key it shows a "configure" notice. The
 * worker generates the buy-widget URL (no private key needed); we open it.
 */

import { useEffect, useState } from 'react'
import { Button, Input } from '@wdk-starter/wdk-ui'
import { Modal } from './modal'
import { getWalletApi } from '@/wallet/wallet-client'

const BUY_ASSETS: Record<string, readonly { code: string, label: string }[]> = {
  ethereum: [{ code: 'eth', label: 'ETH' }, { code: 'usdt', label: 'USDT' }, { code: 'usdc', label: 'USDC' }],
  'polygon-mainnet': [{ code: 'matic_polygon', label: 'POL' }, { code: 'usdt_polygon', label: 'USDT' }],
  'arbitrum-mainnet': [{ code: 'eth_arbitrum', label: 'ETH' }, { code: 'usdt_arbitrum', label: 'USDT' }],
  'bitcoin-mainnet': [{ code: 'btc', label: 'BTC' }],
  'solana-mainnet': [{ code: 'sol', label: 'SOL' }, { code: 'usdc_sol', label: 'USDC' }],
  'ton-mainnet': [{ code: 'ton', label: 'TON' }],
  'tron-mainnet': [{ code: 'trx', label: 'TRX' }, { code: 'usdt_tron', label: 'USDT' }]
}

export function BuyDialog ({ chainId, address, onClose }: { chainId: string, address: string, onClose: () => void }) {
  const assets = BUY_ASSETS[chainId]
  const [config, setConfig] = useState<'checking' | 'on' | 'off'>('checking')
  const [assetIdx, setAssetIdx] = useState(0)
  const [amount, setAmount] = useState('100')
  const [quote, setQuote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const asset = assets?.[assetIdx]

  useEffect(() => {
    let off = false
    void (async () => {
      try {
        const ok = await getWalletApi().moonpay_isConfigured()
        if (!off) setConfig(ok ? 'on' : 'off')
      } catch { if (!off) setConfig('off') }
    })()
    return () => { off = true }
  }, [])

  async function getQuote () {
    setError(null); setQuote(null)
    if (!asset) return
    const fiat = Number(amount)
    if (!Number.isFinite(fiat) || fiat <= 0) { setError('Enter a valid amount.'); return }
    setBusy(true)
    try {
      const q = await getWalletApi().moonpay_quoteBuy('usd', asset.code, fiat)
      if (!q) { setError('MoonPay is not configured.'); return }
      setQuote(`≈ ${q.cryptoAmount} ${asset.label} · fee $${q.feeAmount.toFixed(2)}`)
    } catch (e) { setError(e instanceof Error ? e.message : 'Quote failed') } finally { setBusy(false) }
  }
  async function buy () {
    if (!asset) return
    setBusy(true); setError(null)
    try {
      const url = await getWalletApi().moonpay_buy('usd', asset.code, Number(amount), address)
      window.open(url, '_blank', 'noopener,noreferrer')
      onClose()
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not open MoonPay'); setBusy(false) }
  }

  return (
    <Modal title="Buy crypto" onClose={onClose}>
      {config === 'checking' && <p style={pill}>Checking MoonPay…</p>}
      {config === 'off' && (
        <p style={note}>MoonPay on-ramp is ready to enable. Set <code>NEXT_PUBLIC_MOONPAY_API_KEY</code> (your publishable key) — and <code>NEXT_PUBLIC_MOONPAY_SIGN_URL</code> for production. The integration is fully wired; defaults to sandbox.</p>
      )}
      {config === 'on' && !assets && <p style={note}>No MoonPay assets mapped for this chain.</p>}
      {config === 'on' && assets && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {assets.map((a, i) => <Button key={a.code} size="sm" variant={assetIdx === i ? 'primary' : 'secondary'} onClick={() => { setAssetIdx(i); setQuote(null) }} style={{ flex: 1 }}>{a.label}</Button>)}
          </div>
          <Input value={amount} onChange={(e) => { setAmount(e.target.value); setQuote(null) }} placeholder="Amount (USD)" inputMode="decimal" />
          {quote && <div style={pill}>{quote}</div>}
          {error && <p style={err}>{error}</p>}
          {quote
            ? <Button onClick={buy} disabled={busy} style={{ width: '100%' }}>{busy ? 'Opening…' : 'Continue to MoonPay ↗'}</Button>
            : <Button onClick={getQuote} disabled={busy} style={{ width: '100%' }}>{busy ? 'Quoting…' : 'Get quote'}</Button>}
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary, #b3a79f)' }}>Delivered to your address on this chain. MoonPay opens in a new tab.</p>
        </div>
      )}
    </Modal>
  )
}

const note: React.CSSProperties = { margin: 0, padding: '10px 12px', background: 'var(--bg-elevated-2, #241f1c)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary, #b3a79f)', lineHeight: 1.5 }
const pill: React.CSSProperties = { padding: '8px 10px', background: 'var(--bg-elevated-2, #241f1c)', borderRadius: 8, fontSize: 13 }
const err: React.CSSProperties = { margin: 0, color: 'var(--color-error, #ef4444)', fontSize: 13 }
