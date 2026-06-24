'use client'

import { useState } from 'react'
import { Card } from '@wdk-starter/wdk-ui'
import { useWallet, type TxRecord } from '@/wallet/wallet-provider'
import { formatAmount, getChain } from '@/wallet/chains'
import { TxDetail } from './tx-detail'

function short (addr: string) {
  return addr.length > 14 ? `${addr.slice(0, 8)}…${addr.slice(-6)}` : addr
}

const STATUS_LABEL: Record<TxRecord['status'], string> = {
  pending: 'pending',
  success: 'confirmed',
  failed: 'failed'
}

function statusColor (status: TxRecord['status']): string {
  return status === 'success'
    ? 'var(--color-success, #16a34a)'
    : status === 'failed'
      ? 'var(--color-error, #ef4444)'
      : 'var(--text-secondary, #b3a79f)'
}

export function Activity () {
  const { transactions } = useWallet()
  const [selected, setSelected] = useState<TxRecord | null>(null)

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h3 style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary, #b3a79f)' }}>Activity</h3>
      {transactions.length === 0
        ? (
          <Card padding="md">
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary, #b3a79f)' }}>
              No transactions yet. Transactions you send appear here with live status. Full historical
              history is provided by the <strong>WDK Indexer API</strong> — see the README for wiring the
              indexer adapter.
            </p>
          </Card>
          )
        : (
          <Card padding="none">
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {transactions.map((tx) => {
                const chain = getChain(tx.chainId)
                return (
                  <li
                    key={tx.hash}
                    style={row}
                    onClick={() => setSelected(tx)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelected(tx) }}
                    title="View transaction details"
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 14 }}>Sent to {short(tx.to)}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary, #b3a79f)' }}>
                        {chain.name} · {new Date(tx.ts).toLocaleTimeString()}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 14 }}>-{formatAmount(BigInt(tx.amount), chain.decimals)} {tx.symbol}</span>
                      <span style={{ fontSize: 12, color: statusColor(tx.status), display: 'inline-flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                        <span aria-hidden style={{ width: 6, height: 6, borderRadius: 999, background: statusColor(tx.status), display: 'inline-block' }} />
                        {STATUS_LABEL[tx.status]} · details ›
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </Card>
          )}
      {selected && <TxDetail tx={selected} onClose={() => setSelected(null)} />}
    </section>
  )
}

const row: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '12px 16px', borderBottom: '1px solid var(--border-subtle, var(--border))',
  cursor: 'pointer'
}
