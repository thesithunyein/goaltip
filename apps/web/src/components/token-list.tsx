'use client'

/**
 * TokenList — held ERC-20 balances for the active EVM chain.
 */

import { useEffect, useState } from 'react'
import { Skeleton, TokenIcon } from '@wdk-starter/wdk-ui'
import { getWalletApi } from '@/wallet/wallet-client'
import { formatAmount } from '@/wallet/chains'
import { tokensFor, type TokenInfo } from '@/wallet/tokens'

interface Row { readonly token: TokenInfo, readonly balance: bigint | null }

export function TokenList ({ chainId, address, onSelect }: { chainId: string, address: string, onSelect: (token: TokenInfo) => void }) {
  const tokens = tokensFor(chainId)
  const [rows, setRows] = useState<Row[] | null>(null)

  useEffect(() => {
    if (tokens.length === 0) { setRows(null); return }
    let cancelled = false
    setRows(null)
    void (async () => {
      const api = getWalletApi()
      const result = await Promise.all(tokens.map(async (token): Promise<Row> => {
        try {
          const raw = await api.rpc_getTokenBalance(chainId as never, address, token.address)
          return { token, balance: BigInt(raw) }
        } catch {
          return { token, balance: null }
        }
      }))
      if (!cancelled) setRows(result)
    })()
    return () => { cancelled = true }
  }, [chainId, address]) // eslint-disable-line react-hooks/exhaustive-deps

  if (tokens.length === 0) return null

  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
      {(rows ?? tokens.map((token) => ({ token, balance: null }))).map(({ token, balance }) => (
        <button
          key={token.address}
          onClick={() => onSelect(token)}
          title={`${token.symbol} details`}
          className="goaltip-soft-card"
          style={card}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
              <TokenIcon symbol={token.symbol} size={22} />{token.symbol}
            </span>
            <span style={{ fontSize: 16, color: 'var(--text-tertiary)' }}>···</span>
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 18 }}>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4 }}>
              {rows === null
                ? <Skeleton style={{ width: 72, height: 24 }} />
                : balance === null ? '—' : formatAmount(balance, token.decimals)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{token.symbol}</div>
          </div>
        </button>
      ))}
    </div>
  )
}

const card: React.CSSProperties = {
  flex: '0 0 200px',
  minHeight: 148,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  textAlign: 'left',
  padding: 16,
  cursor: 'pointer',
  color: 'inherit',
  font: 'inherit'
}
