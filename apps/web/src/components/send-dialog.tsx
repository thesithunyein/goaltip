'use client'

/**
 * SendDialog — the pro-wallet Send flow: Form → Review → Success, built on the
 * shared wdk-ui primitives (AmountInput with fiat⇄crypto + Max, ReviewSheet,
 * SuccessScreen). Native or ERC-20 (token mode sends a transfer() to the token
 * contract). Per-family address validation, paste-aware payment URIs, and the
 * cross-VM signpost are preserved from the worklet engine.
 */

import { useEffect, useState } from 'react'
import { Button, Input, AmountInput, ReviewSheet, SuccessScreen, type ReviewRow } from '@wdk-starter/wdk-ui'
import { Modal } from './modal'
import { useWallet } from '@/wallet/wallet-provider'
import { getWalletApi } from '@/wallet/wallet-client'
import { getChain, familyOf, parseAmount, formatAmount, type ChainFamily } from '@/wallet/chains'
import { encodeErc20Transfer } from '@/wallet/erc20'
import type { TokenInfo } from '@/wallet/tokens'
import { crossVmSignpost, FAMILY_LABEL } from '@/wallet/bridge'
import { validateAddress, parsePaymentUri } from '@wdk-starter/wdk-web-core/payments'

/** Formats a base-unit bigint back into a decimal string (to prefill an amount from a payment URI). */
function formatBaseToDecimal (base: bigint, decimals: number): string {
  const divisor = 10n ** BigInt(decimals)
  const whole = base / divisor
  const frac = (base % divisor).toString().padStart(decimals, '0').replace(/0+$/, '')
  return frac ? `${whole}.${frac}` : whole.toString()
}

function middleTruncate (s: string): string {
  return s.length > 18 ? `${s.slice(0, 10)}…${s.slice(-6)}` : s
}

function formatUsd (n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

const PLACEHOLDER: Record<ChainFamily, string> = {
  evm: '0x…',
  solana: 'Base58 address',
  bitcoin: 'bc1… or legacy address',
  ton: 'EQ… / UQ… address',
  tron: 'T… address'
}

type Phase = 'form' | 'review' | 'sending' | 'sent'

export function SendDialog ({ chainId, token, onClose }: { chainId: string, token?: TokenInfo | null, onClose: () => void }) {
  const { send, balance, accountIndex, address } = useWallet()
  const chain = getChain(chainId)
  const family = familyOf(chainId)
  // In token mode the amount/label use the token's units, and the send goes out
  // as an ERC-20 transfer() to the token contract rather than a native transfer.
  const symbol = token ? token.symbol : chain.symbol
  const decimals = token ? token.decimals : chain.decimals
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('form')
  const [hash, setHash] = useState('')
  const [usdPrice, setUsdPrice] = useState<number | undefined>(undefined)
  const [spendable, setSpendable] = useState<bigint | undefined>(token ? undefined : balance)

  // If the pasted address belongs to a different network family, point the user
  // at the right bridge instead of letting them broadcast into a black hole.
  const signpost = crossVmSignpost(family, to)

  // Best-effort unit price → enables the AmountInput fiat flip + the review's USD line.
  useEffect(() => {
    let off = false
    void (async () => {
      try { const p = await getWalletApi().pricing_getUsdPrice(symbol); if (!off && typeof p === 'number' && p > 0) setUsdPrice(p) } catch { /* unpriced — no fiat toggle */ }
    })()
    return () => { off = true }
  }, [symbol])

  // Spendable balance for "Max": native reuses the provider's balance; a token
  // reads its own ERC-20 balance through the worklet.
  useEffect(() => {
    if (!token) { setSpendable(balance); return }
    if (!address) return
    let off = false
    void (async () => {
      try { const raw = await getWalletApi().rpc_getTokenBalance(chainId as never, address, token.address); if (!off) setSpendable(BigInt(raw)) } catch { if (!off) setSpendable(undefined) }
    })()
    return () => { off = true }
  }, [token, address, chainId, balance])

  // Paste-aware recipient: a BIP-21 (bitcoin:) or EIP-681 (ethereum:) payment URI
  // fills the address and, when present, the amount — a scanned/copied request "just works".
  function onRecipientChange (raw: string) {
    const parsed = parsePaymentUri(raw.trim())
    if (parsed && parsed.scheme === 'bip21' && family === 'bitcoin') {
      setTo(parsed.address)
      if (parsed.satoshis !== undefined) setAmount(formatBaseToDecimal(parsed.satoshis, 8))
      return
    }
    if (parsed && parsed.scheme === 'eip681' && family === 'evm' && !token) {
      setTo(parsed.address)
      if (parsed.wei !== undefined) setAmount(formatBaseToDecimal(parsed.wei, 18))
      return
    }
    setTo(raw)
  }

  /** Validate the form and advance to Review. */
  function toReview () {
    setError(null)
    const check = validateAddress(family, to.trim())
    if (!check.valid) {
      setError(signpost ? `This is a ${FAMILY_LABEL[signpost.detected]} address — bridge first, don’t send it on ${FAMILY_LABEL[family]}.` : (check.reason ? `Enter a valid recipient address — ${check.reason}.` : 'Enter a valid recipient address.'))
      return
    }
    let amountBase: bigint
    try { amountBase = parseAmount(amount, decimals) } catch (e) { setError(e instanceof Error ? e.message : 'Invalid amount.'); return }
    if (amountBase <= 0n) { setError('Amount must be greater than zero.'); return }
    if (spendable !== undefined && amountBase > spendable) { setError('Insufficient balance.'); return }
    setPhase('review')
  }

  /** Sign + broadcast from the Review step. */
  async function confirm () {
    setError(null)
    let amountBase: bigint
    try { amountBase = parseAmount(amount, decimals) } catch { setError('Invalid amount.'); setPhase('form'); return }
    setPhase('sending')
    try {
      // ERC-20: call the token contract with transfer() calldata, value 0. Native: the provider's send().
      const txHash = token
        ? await getWalletApi().account_sendTransaction(chainId as never, accountIndex, { to: token.address, value: 0n, data: encodeErc20Transfer(to.trim(), amountBase) })
        : await send(to.trim(), amountBase)
      setHash(txHash as string)
      setPhase('sent')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transaction failed.')
      setPhase('review')
    }
  }

  const maxStr = spendable !== undefined ? formatAmount(spendable, decimals) : undefined
  const amountNum = Number.parseFloat(amount)
  const usdValue = usdPrice !== undefined && Number.isFinite(amountNum) ? formatUsd(amountNum * usdPrice) : null

  const reviewRows: ReviewRow[] = [
    { label: 'To', value: middleTruncate(to.trim()), mono: true },
    { label: 'Amount', value: `${amount} ${symbol}` },
    ...(usdValue ? [{ label: 'Value', value: usdValue }] : []),
    { label: 'Network', value: `${chain.name}${chain.testnet ? ' · testnet' : ''}` }
  ]

  return (
    <Modal title={`Send ${symbol}`} onClose={onClose}>
      {phase === 'form' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={field}>
            <span style={labelText}>Recipient address</span>
            <Input value={to} onChange={(e) => onRecipientChange(e.target.value)} placeholder={PLACEHOLDER[family]} />
          </label>
          {signpost && (
            <div style={signpostBox} role="note">
              <strong style={{ fontSize: 13 }}>That looks like a {FAMILY_LABEL[signpost.detected]} address.</strong>
              <span style={{ fontSize: 12 }}>
                You’re sending {symbol} on {FAMILY_LABEL[family]}. Funds can’t cross networks directly — {signpost.note}
              </span>
              {signpost.url && (
                <a href={signpost.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 600 }}>
                  Open {signpost.provider} ↗
                </a>
              )}
            </div>
          )}
          <label style={field}>
            <span style={labelText}>Amount</span>
            <AmountInput value={amount} onChange={setAmount} symbol={symbol} usdPrice={usdPrice} max={maxStr} />
          </label>
          {error && <p style={errorText}>{error}</p>}
          <Button onClick={toReview} style={{ width: '100%' }}>Review</Button>
        </div>
      )}

      {(phase === 'review' || phase === 'sending') && (
        <ReviewSheet
          title={`Send ${symbol}`}
          rows={reviewRows}
          confirmLabel="Confirm & send"
          onConfirm={confirm}
          onCancel={() => { setError(null); setPhase('form') }}
          busy={phase === 'sending'}
          busyLabel="Submitting…"
          error={error}
          note="Double-check the recipient and network — on-chain sends can’t be reversed."
        />
      )}

      {phase === 'sent' && (
        <SuccessScreen
          title="Sent"
          message={`${amount} ${symbol} is on its way.`}
          hash={hash}
          link={chain.explorer ? { href: `${chain.explorer}/tx/${hash}`, label: 'View on explorer' } : undefined}
          onDone={onClose}
        />
      )}
    </Modal>
  )
}

const field: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }
const labelText: React.CSSProperties = { fontSize: 13, color: 'var(--text-secondary, #b3a79f)' }
const errorText: React.CSSProperties = { margin: 0, color: 'var(--color-error, #ef4444)', fontSize: 13 }
const signpostBox: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 4,
  padding: '10px 12px', borderRadius: 'var(--radius-md, 10px)',
  background: 'var(--bg-elevated-2, rgba(244,100,47,0.08))',
  border: '1px solid var(--color-warning, rgba(244,100,47,0.4))'
}
