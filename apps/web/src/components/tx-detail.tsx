'use client'

import { useState } from 'react'
import { Modal } from './modal'
import { getChain, formatAmount } from '@/wallet/chains'
import type { TxRecord } from '@/wallet/wallet-provider'

/** Per-transaction detail: amount, parties, status, time, hash, explorer link. */
export function TxDetail ({ tx, onClose }: { tx: TxRecord, onClose: () => void }) {
  const chain = getChain(tx.chainId)
  const [copied, setCopied] = useState(false)

  async function copyHash () {
    await navigator.clipboard.writeText(tx.hash)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Modal title="Transaction" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>
            -{formatAmount(BigInt(tx.amount), chain.decimals)} {tx.symbol}
          </div>
          <span style={statusPill(tx.status)}>{tx.status}</span>
        </div>

        <Row label="Network" value={`${chain.name}${chain.testnet ? ' · testnet' : ''}`} />
        <Row label="To" value={tx.to} mono />
        <Row label="Time" value={new Date(tx.ts).toLocaleString()} />
        <Row
          label="Tx hash"
          value={(
            <button onClick={copyHash} style={hashBtn} title="Copy hash">
              <span style={{ fontFamily: 'ui-monospace, monospace' }}>{tx.hash.slice(0, 10)}…{tx.hash.slice(-8)}</span>
              {copied ? ' ✓' : ' ⧉'}
            </button>
          )}
        />

        {chain.explorer && (
          <a
            href={`${chain.explorer}/tx/${tx.hash}`}
            target="_blank"
            rel="noreferrer"
            style={{ marginTop: 14, textAlign: 'center', fontSize: 13, fontWeight: 600 }}
          >
            View on block explorer ↗
          </a>
        )}
      </div>
    </Modal>
  )
}

function Row ({ label, value, mono }: { label: string, value: React.ReactNode, mono?: boolean }) {
  return (
    <div style={rowStyle}>
      <span style={{ fontSize: 13, color: 'var(--text-secondary, #b3a79f)' }}>{label}</span>
      <span style={{ fontSize: 13, textAlign: 'right', wordBreak: 'break-all', maxWidth: '65%', fontFamily: mono ? 'ui-monospace, monospace' : 'inherit' }}>
        {value}
      </span>
    </div>
  )
}

const rowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  padding: '10px 0', borderBottom: '1px solid var(--border-subtle, var(--border))'
}
const hashBtn: React.CSSProperties = {
  background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13, padding: 0
}
function statusPill (status: TxRecord['status']): React.CSSProperties {
  const ok = status === 'submitted'
  return {
    display: 'inline-block', marginTop: 6, fontSize: 12, padding: '2px 10px', borderRadius: 999,
    color: ok ? 'var(--color-success, #16a34a)' : 'var(--color-error, #ef4444)',
    background: 'var(--bg-elevated-2, rgba(255,255,255,0.05))'
  }
}
