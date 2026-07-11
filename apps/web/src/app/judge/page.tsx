'use client'

import { useEffect, useState } from 'react'

/**
 * In-app judge entry — live health + 3-minute Cup demo path.
 * Open: /judge
 */
export default function JudgePage (): React.JSX.Element {
  const [health, setHealth] = useState<Record<string, unknown> | null>(null)
  const [healthErr, setHealthErr] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' })
        const data = await res.json() as Record<string, unknown>
        setHealth(data)
      } catch (e) {
        setHealthErr(e instanceof Error ? e.message : 'Health probe failed')
      }
    })()
  }, [])

  return (
    <main style={page}>
      <div style={card}>
        <p style={eyebrow}>Tether Developers Cup · Judge</p>
        <h1 style={h1}>GoalTip</h1>
        <p style={lead}>
          Self-custodial USDt watch-party tipping on Tether WDK — TipPool escrow, verified tips, on-chain settle.
          Optional QVAC coach runs locally on-device.
        </p>

        <section style={section}>
          <h2 style={h2}>Live health</h2>
          {healthErr && <p style={err}>{healthErr}</p>}
          {health && (
            <pre style={pre}>{JSON.stringify(health, null, 2)}</pre>
          )}
          <p style={dim}>
            Expect <code>persistence: &quot;redis&quot;</code>, <code>escrow: &quot;tippool-per-room&quot;</code>,{' '}
            <code>settle: &quot;on-chain-tippool+board&quot;</code>.
          </p>
        </section>

        <section style={section}>
          <h2 style={h2}>3-minute flow</h2>
          <ol style={ol}>
            <li>Open <a href="/">app</a> → unlock / create wallet (Web Worker)</li>
            <li>Party → Create shared room (deploys TipPool; enable spend limit) → Copy invite</li>
            <li>Second browser/phone: open invite → same board</li>
            <li>Tip 1 USDt → <strong>Verified</strong> → explorer (Transfer into TipPool)</li>
            <li>Try tipping past the cap → blocked before any signature</li>
            <li>Host Settle → TipPool.settle on-chain → winner on both devices</li>
          </ol>
        </section>

        <section style={section}>
          <h2 style={h2}>Faucets</h2>
          <ul style={ul}>
            <li><a href="https://www.alchemy.com/faucets/ethereum-sepolia" target="_blank" rel="noreferrer">Sepolia ETH</a> (needed to deploy TipPool)</li>
            <li><a href="https://app.aave.com/faucet/" target="_blank" rel="noreferrer">Aave Sepolia USDT</a> (Testnet Mode)</li>
          </ul>
        </section>

        <section style={section}>
          <h2 style={h2}>Optional QVAC (multi-track)</h2>
          <pre style={pre}>{`pnpm add @qvac/sdk
pnpm demo
# or: npm run coach  (separate terminal)
# Coach tab → Recheck → ask a match question`}</pre>
          <p style={dim}>QVAC is on-device only — expected offline on the Vercel URL.</p>
        </section>

        <p style={{ ...dim, marginTop: 8 }}>
          Docs: <a href="https://github.com/thesithunyein/goaltip/blob/main/JUDGE.md" target="_blank" rel="noreferrer">JUDGE.md</a>
          {' · '}
          <a href="https://github.com/thesithunyein/goaltip" target="_blank" rel="noreferrer">GitHub</a>
        </p>

        <a href="/" style={cta}>Open GoalTip →</a>
      </div>
    </main>
  )
}

const page: React.CSSProperties = {
  minHeight: '100dvh',
  padding: '28px 16px 40px',
  background: 'var(--bg-base, #f2f3f5)',
  color: 'var(--text-primary, #111827)',
  fontFamily: 'var(--font-body, system-ui, sans-serif)'
}
const card: React.CSSProperties = {
  maxWidth: 560,
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  padding: 24,
  borderRadius: 24,
  background: 'var(--bg-elevated-1, #fff)',
  border: '1px solid var(--border-subtle, rgba(17,24,39,0.08))',
  boxShadow: 'var(--goaltip-shadow, 0 4px 20px rgba(17,24,39,0.06))'
}
const eyebrow: React.CSSProperties = { margin: 0, fontSize: 13, color: 'var(--text-secondary, #666)' }
const h1: React.CSSProperties = { margin: 0, fontSize: 32, fontWeight: 750, letterSpacing: -0.6 }
const lead: React.CSSProperties = { margin: 0, fontSize: 15, lineHeight: 1.5, color: 'var(--text-secondary, #555)' }
const section: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 }
const h2: React.CSSProperties = { margin: 0, fontSize: 16, fontWeight: 700 }
const dim: React.CSSProperties = { margin: 0, fontSize: 13, lineHeight: 1.45, color: 'var(--text-secondary, #666)' }
const err: React.CSSProperties = { margin: 0, color: 'var(--color-error, #ef4444)', fontSize: 13 }
const pre: React.CSSProperties = {
  margin: 0,
  padding: 12,
  borderRadius: 12,
  background: 'var(--bg-elevated-2, #f3f4f6)',
  fontSize: 12,
  overflow: 'auto',
  lineHeight: 1.4
}
const ol: React.CSSProperties = { margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.55 }
const ul: React.CSSProperties = { margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.55 }
const cta: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 4,
  minHeight: 48,
  borderRadius: 999,
  background: 'var(--color-primary, #f4642f)',
  color: '#fff',
  fontWeight: 600,
  textDecoration: 'none'
}
