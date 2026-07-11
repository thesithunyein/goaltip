'use client'

import { useState } from 'react'
import { Card, StatusPill } from '@wdk-starter/wdk-ui'
import { useWallet, type TxRecord } from '@/wallet/wallet-provider'
import { formatAmount, getChain } from '@/wallet/chains'
import { softCardStyle, softDim } from '@/lib/soft-ui'
import { TxDetail } from './tx-detail'

function short (addr: string) {
  return addr.length > 14 ? `${addr.slice(0, 8)}…${addr.slice(-6)}` : addr
}

export function Activity () {
  const { transactions } = useWallet()
  const [selected, setSelected] = useState<TxRecord | null>(null)

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {transactions.length === 0
        ? (
          <Card padding="md" variant="elevated" style={softCardStyle}>
            <p style={softDim}>
              No transactions yet. Sends appear here with live status.
            </p>
          </Card>
          )
        : (
          <Card padding="none" variant="elevated" style={{ ...softCardStyle, gap: 0, overflow: 'hidden' }}>
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
                      <span style={{ fontSize: 14, fontWeight: 600 }}>Sent to {short(tx.to)}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {chain.name} · {new Date(tx.ts).toLocaleTimeString()}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>-{formatAmount(BigInt(tx.amount), chain.decimals)} {tx.symbol}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                        <StatusPill status={tx.status} size="sm" />
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>details ›</span>
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
