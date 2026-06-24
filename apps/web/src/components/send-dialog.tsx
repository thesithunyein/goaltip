'use client'

import { useState } from 'react'
import { Button, Input } from '@wdk-starter/wdk-ui'
import { Modal } from './modal'
import { useWallet } from '@/wallet/wallet-provider'
import { getWalletApi } from '@/wallet/wallet-client'
import { getChain, familyOf, parseAmount, type ChainFamily } from '@/wallet/chains'
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

const PLACEHOLDER: Record<ChainFamily, string> = {
  evm: '0x…',
  solana: 'Base58 address',
  bitcoin: 'bc1… or legacy address',
  ton: 'EQ… / UQ… address',
  tron: 'T… address'
}

export function SendDialog ({ chainId, token, onClose }: { chainId: string, token?: TokenInfo | null, onClose: () => void }) {
  const { send, balance, accountIndex } = useWallet()
  const chain = getChain(chainId)
  const family = familyOf(chainId)
  // In token mode the amount/label use the token's units, and the send goes out
  // as an ERC-20 transfer() to the token contract rather than a native transfer.
  const symbol = token ? token.symbol : chain.symbol
  const decimals = token ? token.decimals : chain.decimals
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<'form' | 'sending' | 'sent'>('form')
  const [hash, setHash] = useState('')

  // If the pasted address belongs to a different network family, point the user
  // at the right bridge instead of letting them broadcast into a black hole.
  const signpost = crossVmSignpost(family, to)

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

  async function submit () {
    setError(null)
    const check = validateAddress(family, to.trim())
    if (!check.valid) {
      // The cross-VM signpost (shown above the field) already explains the fix.
      setError(signpost ? `This is a ${FAMILY_LABEL[signpost.detected]} address — bridge first, don’t send it on ${FAMILY_LABEL[family]}.` : (check.reason ? `Enter a valid recipient address — ${check.reason}.` : 'Enter a valid recipient address.'))
      return
    }
    let amountBase: bigint
    try {
      amountBase = parseAmount(amount, decimals)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid amount.'); return
    }
    if (amountBase <= 0n) { setError('Amount must be greater than zero.'); return }
    // The native `balance` doesn't bound a token transfer, so only check it for native sends.
    if (!token && balance !== undefined && amountBase > balance) { setError('Insufficient balance.'); return }

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
      setPhase('form')
    }
  }

  return (
    <Modal title={`Send ${symbol}`} onClose={onClose}>
      {phase !== 'sent' && (
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
            <span style={labelText}>Amount ({symbol})</span>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" inputMode="decimal" />
          </label>
          {error && <p style={errorText}>{error}</p>}
          <Button onClick={submit} disabled={phase === 'sending'} style={{ width: '100%' }}>
            {phase === 'sending' ? 'Submitting…' : 'Review & send'}
          </Button>
        </div>
      )}

      {phase === 'sent' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
          <div style={{ fontSize: 40 }}>✅</div>
          <p style={{ margin: 0, textAlign: 'center' }}>Transaction submitted.</p>
          {chain.explorer && (
            <a href={`${chain.explorer}/tx/${hash}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, wordBreak: 'break-all', textAlign: 'center' }}>
              View on explorer ↗
            </a>
          )}
          <Button onClick={onClose} style={{ width: '100%' }}>Done</Button>
        </div>
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
