'use client'

/**
 * Screen — the shared full-height layout for a tab destination in the wallet
 * shell (title + optional subtitle + body). Swap / Earn / Activity / Settings
 * all sit on it so the pro-wallet IA reads consistently. Pure presentation.
 */

export function Screen ({ title, subtitle, children }: { title: string, subtitle?: string, children: React.ReactNode }): React.JSX.Element {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', padding: '20px 16px 28px', gap: 16, color: 'var(--text-primary)' }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: -0.4, color: 'var(--text-primary)' }}>{title}</h1>
        {subtitle && <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>{subtitle}</p>}
      </div>
      {children}
    </main>
  )
}
