/** Shared Soft UI styles — theme-token driven for light + dark. */

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
  boxShadow: 'var(--goaltip-shadow)',
  border: '1px solid var(--border-subtle)',
  background: 'var(--bg-elevated-1)',
  color: 'var(--text-primary)'
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
