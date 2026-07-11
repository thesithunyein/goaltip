/** Shared Soft Light styles — keep Party/Coach/Activity/Settings matching Wallet. */

import type { CSSProperties } from 'react'

export const softPage: CSSProperties = {
  minHeight: '100%',
  padding: '20px 16px 28px',
  background: 'transparent',
  color: 'var(--text-primary)'
}

export const softContainer: CSSProperties = {
  width: '100%',
  maxWidth: 460,
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 14
}

export const softCardStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  borderRadius: 24,
  boxShadow: '0 4px 20px rgba(17,24,39,0.05)',
  border: '1px solid var(--border-subtle, rgba(17,24,39,0.06))',
  background: 'var(--bg-elevated-1, #fff)'
}

export const softDim: CSSProperties = {
  margin: 0,
  color: 'var(--text-secondary)',
  fontSize: 14,
  lineHeight: 1.5
}

export const softH2: CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 700,
  letterSpacing: -0.4,
  color: 'var(--text-primary)'
}

export const softPillBtn: CSSProperties = {
  borderRadius: 999,
  minHeight: 44
}
