'use client'

/**
 * AssetDetail — a per-asset page (PRD pro-wallet hallmark): tap a token to see
 * its balance + USD value, Send / Receive actions, and the recent activity
 * filtered to that asset. Reads the held balance + price through the worklet;
 * the activity comes from the in-session transaction log. Send/Receive hand back
 * to the dashboard's existing flows (prefilled with this token).
 */

import { useEffect, useState } from 'react'
import { Button, Card, TokenIcon, StatusPill } from '@wdk-starter/wdk-ui'
import { Modal } from './modal'
import { useWallet } from '@/wallet/wallet-provider'
import { getWalletApi } from '@/wallet/wallet-client'
import { formatAmount, getChain } from '@/wallet/chains'
import type { TokenInfo } from '@/wallet/tokens'

function short (addr: string) {
  return addr.length > 14 ? `${addr.slice(0, 8)}…${addr.slice(-6)}` : addr
}

export function AssetDetail ({ token, chainId, address, onSend, onReceive, onClose }: {
  token: TokenInfo
  chainId: string
  address: string
  onSend: () => void
  onReceive: () => void
  onClose: () => void
}) {
  const { transactions } = useWallet()
  const chain = getChain(chainId)
  const [balance, setBalance] = useState<bigint | null>(null)
  const [usd, setUsd] = useState<string | null>(null)

  useEffect(() => {
    let off = false
    void (async () => {
      try {
        const raw = await getWalletApi().rpc_getTokenBalance(chainId as never, address, token.address)
        if (off) return
        const bal = BigInt(raw)
        setBalance(bal)
        const price = await getWalletApi().pricing_getUsdPrice(token.symbol)
        if (off) return
        if (typeof price === 'number' && price > 0) {
          const human = Number(bal) / 10 ** token.decimals
          setUsd((human * price).toLocaleString('en-US', { style: 'currency', currency: 'USD' }))
        }
      } catch { if (!off) setBalance(null) }
    })()
    return () => { off = true }
  }, [token, chainId, address])

  const txs = transactions.filter((t) => t.chainId === chainId && t.symbol === token.symbol)

  return (
    <Modal title={token.symbol} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <TokenIcon symbol={token.symbol} size={48} />
          <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.5 }}>
            {balance === null ? '—' : formatAmount(balance, token.decimals)} <span style={{ fontSize: 16, color: 'var(--text-secondary, #b3a79f)' }}>{token.symbol}</span>
          </div>
          {usd && <div style={{ fontSize: 14, color: 'var(--text-secondary, #b3a79f)', marginTop: -4 }}>≈ {usd}</div>}
          <div style={{ fontSize: 12, color: 'var(--text-secondary, #b3a79f)' }}>{chain.name}{chain.testnet ? ' · testnet' : ''}</div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button onClick={onSend} style={{ flex: 1 }}>Send</Button>
          <Button onClick={onReceive} variant="secondary" style={{ flex: 1 }}>Receive</Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary, #b3a79f)' }}>Recent {token.symbol} activity</h3>
          {txs.length === 0
            ? (
              <Card padding="md">
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary, #b3a79f)' }}>
                  No {token.symbol} transactions yet this session. Sends you make appear here with live status.
                </p>
              </Card>
              )
            : (
              <Card padding="none">
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {txs.map((tx) => (
                    <li key={tx.hash} style={row}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 14 }}>Sent to {short(tx.to)}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary, #b3a79f)' }}>{new Date(tx.ts).toLocaleTimeString()}</span>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                        <span style={{ fontSize: 14 }}>-{formatAmount(BigInt(tx.amount), token.decimals)} {tx.symbol}</span>
                        <StatusPill status={tx.status} size="sm" />
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
              )}
        </div>
      </div>
    </Modal>
  )
}

const row: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '12px 16px', borderBottom: '1px solid var(--border-subtle, var(--border))'
}
