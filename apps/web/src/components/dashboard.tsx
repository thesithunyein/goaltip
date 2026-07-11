'use client'

import { useState } from 'react'
import { ChainSelector, NetworkIcon, Skeleton, TokenIcon } from '@wdk-starter/wdk-ui'
import { useWallet } from '@/wallet/wallet-provider'
import { chainOptions, formatAmount, getChain, familyOf } from '@/wallet/chains'
import type { TokenInfo } from '@/wallet/tokens'
import { BrandHeader } from './brand-header'
import { ReceiveDialog } from './receive-dialog'
import { SendDialog } from './send-dialog'
import { TokenList } from './token-list'
import { AssetDetail } from './asset-detail'

const OPTIONS = chainOptions((id) => <NetworkIcon chain={id} size={16} />)

function short (addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function Dashboard () {
  const {
    chainId, setChainId, accountIndex, setAccountIndex,
    address, addressLoading, balance, balanceLoading, usdValue, refreshBalance
  } = useWallet()
  const [dialog, setDialog] = useState<'none' | 'receive' | 'send' | 'asset'>('none')
  const [sendToken, setSendToken] = useState<TokenInfo | null>(null)
  const [copied, setCopied] = useState(false)
  const chain = getChain(chainId)

  async function copy () {
    if (!address) return
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <main style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px 28px' }}>
      <div style={{ width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <BrandHeader />
          <button onClick={() => void refreshBalance()} style={iconBtn} title="Refresh" aria-label="Refresh balances">↻</button>
        </header>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => void copy()} style={addrChip} title="Copy address" disabled={!address}>
            <NetworkIcon chain={chainId} size={16} />
            {addressLoading || !address ? 'deriving…' : copied ? 'Copied' : short(address)}
            <span aria-hidden style={{ opacity: 0.5 }}>▾</span>
          </button>
        </div>

        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 6 }}>Portfolio</div>
          <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1, lineHeight: 1.1, color: 'var(--text-primary)' }}>
            {balanceLoading || balance === undefined
              ? <Skeleton style={{ width: 200, height: 42, margin: '0 auto' }} />
              : (
                <>
                  {formatAmount(balance, chain.decimals)}{' '}
                  <span style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-primary, #f4642f)', display: 'inline-flex', alignItems: 'center', gap: 6, verticalAlign: 'middle' }}>
                    <TokenIcon symbol={chain.symbol} size={22} />{chain.symbol}
                  </span>
                </>
              )}
          </div>
          {usdValue && <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>{usdValue}</div>}
          <div style={{ fontSize: 12, color: 'var(--text-tertiary, var(--text-secondary))', marginTop: 4 }}>
            {chain.name}{chain.testnet ? ' · testnet' : ''}
          </div>
        </div>

        <div className="goaltip-action-pill" style={{ margin: '4px 8px 0' }}>
          <button type="button" onClick={() => setDialog('receive')} disabled={!address}>↓ Receive</button>
          <button type="button" onClick={() => { setSendToken(null); setDialog('send') }} disabled={!address}>Send ↑</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 4 }}>
          <ChainSelector active={chainId} options={OPTIONS} onChange={setChainId} />
          <AccountSwitcher index={accountIndex} onChange={setAccountIndex} />
        </div>

        <div className="goaltip-soft-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Watch party tips</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>Tip nations into TipPool escrow</div>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right', maxWidth: 140 }}>
            Use the Party tab
          </span>
        </div>

        {familyOf(chainId) === 'evm' && address && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 600, paddingLeft: 4 }}>Assets</div>
            <TokenList chainId={chainId} address={address} onSelect={(token) => { setSendToken(token); setDialog('asset') }} />
          </div>
        )}
      </div>

      {dialog === 'receive' && address && <ReceiveDialog address={address} chainId={chainId} onClose={() => setDialog('none')} />}
      {dialog === 'send' && address && <SendDialog chainId={chainId} token={sendToken} onClose={() => setDialog('none')} />}
      {dialog === 'asset' && address && sendToken && (
        <AssetDetail
          token={sendToken}
          chainId={chainId}
          address={address}
          onSend={() => setDialog('send')}
          onReceive={() => setDialog('receive')}
          onClose={() => { setSendToken(null); setDialog('none') }}
        />
      )}
    </main>
  )
}

function AccountSwitcher ({ index, onChange }: { index: number, onChange: (i: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
      <button onClick={() => onChange(Math.max(0, index - 1))} disabled={index === 0} style={stepBtn} aria-label="Previous account">◀</button>
      <span style={{ color: 'var(--text-secondary)' }}>Account {index + 1}</span>
      <button onClick={() => onChange(index + 1)} style={stepBtn} aria-label="Next account">▶</button>
    </div>
  )
}

const addrChip: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: 'var(--bg-elevated-1)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 999,
  padding: '8px 14px',
  color: 'var(--text-primary)',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  boxShadow: 'var(--goaltip-shadow)',
  fontFamily: 'ui-monospace, monospace'
}

const iconBtn: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 999,
  border: '1px solid var(--border-subtle)',
  background: 'var(--bg-elevated-1)',
  cursor: 'pointer',
  fontSize: 16,
  color: 'var(--text-primary)',
  boxShadow: 'var(--goaltip-shadow)'
}

const stepBtn: React.CSSProperties = {
  background: 'var(--bg-elevated-1)', border: '1px solid var(--border-subtle)', borderRadius: 8,
  width: 28, height: 28, cursor: 'pointer', color: 'var(--text-primary)'
}
