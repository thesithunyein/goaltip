'use client'

import { useState } from 'react'
import { Button, Input } from '@wdk-starter/wdk-ui'
import { Modal } from './modal'
import { useWallet } from '@/wallet/wallet-provider'
import { getChain, familyOf, parseAmount, type ChainFamily } from '@/wallet/chains'
import { crossVmSignpost, FAMILY_LABEL } from '@/wallet/bridge'

const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/
const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
const BTC_ADDRESS = /^(bc1|tb1)[0-9ac-hj-np-z]{11,87}$|^[123mn2][a-km-zA-HJ-NP-Z1-9]{25,39}$/
const TON_ADDRESS = /^[A-Za-z0-9_-]{48}$|^-?\d:[0-9a-fA-F]{64}$/
const TRON_ADDRESS = /^T[1-9A-HJ-NP-Za-km-z]{33}$/

const ADDRESS_RE: Record<ChainFamily, RegExp> = {
  evm: EVM_ADDRESS,
  solana: SOLANA_ADDRESS,
  bitcoin: BTC_ADDRESS,
  ton: TON_ADDRESS,
  tron: TRON_ADDRESS
}

const PLACEHOLDER: Record<ChainFamily, string> = {
  evm: '0x…',
  solana: 'Base58 address',
  bitcoin: 'bc1… or legacy address',
  ton: 'EQ… / UQ… address',
  tron: 'T… address'
}

export function SendDialog ({ chainId, onClose }: { chainId: string, onClose: () => void }) {
  const { send, balance } = useWallet()
  const chain = getChain(chainId)
  const family = familyOf(chainId)
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<'form' | 'sending' | 'sent'>('form')
  const [hash, setHash] = useState('')

  // If the pasted address belongs to a different network family, point the user
  // at the right bridge instead of letting them broadcast into a black hole.
  const signpost = crossVmSignpost(family, to)

  async function submit () {
    setError(null)
    if (!ADDRESS_RE[family].test(to.trim())) {
      // The cross-VM signpost (shown above the field) already explains the fix.
      setError(signpost ? `This is a ${FAMILY_LABEL[signpost.detected]} address — bridge first, don’t send it on ${FAMILY_LABEL[family]}.` : 'Enter a valid recipient address.')
      return
    }
    let amountBase: bigint
    try {
      amountBase = parseAmount(amount, chain.decimals)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid amount.'); return
    }
    if (amountBase <= 0n) { setError('Amount must be greater than zero.'); return }
    if (balance !== undefined && amountBase > balance) { setError('Insufficient balance.'); return }

    setPhase('sending')
    try {
      const txHash = await send(to.trim(), amountBase)
      setHash(txHash)
      setPhase('sent')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transaction failed.')
      setPhase('form')
    }
  }

  return (
    <Modal title={`Send ${chain.symbol}`} onClose={onClose}>
      {phase !== 'sent' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={field}>
            <span style={labelText}>Recipient address</span>
            <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder={PLACEHOLDER[family]} />
          </label>
          {signpost && (
            <div style={signpostBox} role="note">
              <strong style={{ fontSize: 13 }}>That looks like a {FAMILY_LABEL[signpost.detected]} address.</strong>
              <span style={{ fontSize: 12 }}>
                You’re sending {chain.symbol} on {FAMILY_LABEL[family]}. Funds can’t cross networks directly — {signpost.note}
              </span>
              {signpost.url && (
                <a href={signpost.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 600 }}>
                  Open {signpost.provider} ↗
                </a>
              )}
            </div>
          )}
          <label style={field}>
            <span style={labelText}>Amount ({chain.symbol})</span>
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
