'use client'

/**
 * TokenList — held ERC-20 balances (USDt, XAUt, …) for the active EVM chain,
 * read through the worklet's `rpc_getTokenBalance`. Each row is tap-to-send: it
 * opens the Send dialog in token mode (an ERC-20 `transfer()` under the hood).
 * Renders nothing on chains with no configured tokens.
 */

import { useEffect, useState } from 'react'
import { Card, Skeleton, TokenIcon } from '@wdk-starter/wdk-ui'
import { getWalletApi } from '@/wallet/wallet-client'
import { formatAmount } from '@/wallet/chains'
import { tokensFor, type TokenInfo } from '@/wallet/tokens'

interface Row { readonly token: TokenInfo, readonly balance: bigint | null }

export function TokenList ({ chainId, address, onSend }: { chainId: string, address: string, onSend: (token: TokenInfo) => void }) {
  const tokens = tokensFor(chainId)
  const [rows, setRows] = useState<Row[] | null>(null)

  useEffect(() => {
    if (tokens.length === 0) { setRows(null); return }
    let cancelled = false
    setRows(null)
    void (async () => {
      const api = getWalletApi()
      // One failing token reads as null rather than blanking the others.
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
    // tokens is derived from chainId, so chainId + address fully key this effect.
  }, [chainId, address]) // eslint-disable-line react-hooks/exhaustive-deps

  if (tokens.length === 0) return null

  return (
    <Card padding="lg" variant="elevated" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 13, color: 'var(--text-secondary, #b3a79f)' }}>Tokens</div>
      {(rows ?? tokens.map((token) => ({ token, balance: null }))).map(({ token, balance }) => (
        <button
          key={token.address}
          onClick={() => onSend(token)}
          title={`Send ${token.symbol}`}
          style={row}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            <TokenIcon symbol={token.symbol} size={20} />{token.symbol}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              {rows === null
                ? <Skeleton style={{ width: 54, height: 16 }} />
                : balance === null ? '—' : formatAmount(balance, token.decimals)}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary, #b3a79f)' }}>Send ›</span>
          </span>
        </button>
      ))}
    </Card>
  )
}

const row: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
  padding: '6px 0', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', font: 'inherit'
}
