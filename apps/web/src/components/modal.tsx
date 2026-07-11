'use client'

import { useEffect } from 'react'

export function Modal ({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} style={panel} role="dialog" aria-modal="true" aria-label={title}>
        <div style={header}>
          <strong style={{ fontSize: 17, letterSpacing: -0.2 }}>{title}</strong>
          <button onClick={onClose} aria-label="Close" style={closeBtn}>✕</button>
        </div>
        <div style={body}>{children}</div>
      </div>
    </div>
  )
}

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(17,24,39,0.35)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  padding: '12px 12px calc(12px + env(safe-area-inset-bottom, 0px))',
  zIndex: 50
}

const panel: React.CSSProperties = {
  width: '100%',
  maxWidth: 440,
  maxHeight: '88dvh',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--bg-elevated-1, #fff)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 24,
  overflow: 'hidden',
  boxShadow: '0 16px 48px rgba(17,24,39,0.18)'
}

const header: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 18px',
  borderBottom: '1px solid var(--border-subtle)',
  flexShrink: 0
}

const body: React.CSSProperties = {
  padding: 18,
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch'
}

const closeBtn: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 999,
  background: 'var(--bg-elevated-2)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-primary)',
  fontSize: 14,
  cursor: 'pointer'
}
