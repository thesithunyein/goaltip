'use client'

import { useEffect, useState } from 'react'
import { ThemePicker, BrandPicker, isValidHexPrimary, Button } from '@wdk-starter/wdk-ui'
import { Modal } from './modal'
import { useAppearance, TEMPLATE_BRAND } from './appearance-provider'

/**
 * In-app Appearance settings. Soft Light surfaces stay locked in light mode
 * so Wallet / Party / Settings stay visually consistent for the Cup demo.
 */
export function AppearanceDialog () {
  const {
    theme, setTheme, customPrimary, setCustomPrimary,
    brand, setBrand, setOpen, resetSoftLight
  } = useAppearance()

  const [hexDraft, setHexDraft] = useState(customPrimary ?? '')
  useEffect(() => { setHexDraft(customPrimary ?? '') }, [customPrimary])

  function commitHex (raw: string) {
    setHexDraft(raw)
    const v = raw.trim()
    if (v === '') setCustomPrimary(null)
    else if (isValidHexPrimary(v)) setCustomPrimary(v)
  }

  return (
    <Modal title="Appearance" onClose={() => setOpen(false)}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Button
          variant="secondary"
          onClick={() => { resetSoftLight(); setHexDraft('') }}
          style={{ width: '100%', borderRadius: 999, minHeight: 44 }}
        >
          Reset Soft Light (demo default)
        </Button>

        <section>
          <ThemePicker value={theme} onChange={setTheme} />
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={labelStyle}>Custom primary color</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={customPrimary ?? theme.colors.primary}
              onChange={(e) => commitHex(e.target.value)}
              aria-label="Custom primary color"
              style={{ width: 40, height: 32, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
            />
            <input
              type="text"
              inputMode="text"
              placeholder="#RRGGBB"
              value={hexDraft}
              onChange={(e) => commitHex(e.target.value)}
              spellCheck={false}
              style={hexInput}
            />
            {customPrimary && (
              <button onClick={() => setCustomPrimary(null)} style={resetLink}>Reset</button>
            )}
          </div>
          <span style={hintStyle}>Overrides the swatch above. Light mode keeps Soft Light surfaces.</span>
        </section>

        <section>
          <BrandPicker value={brand} onChange={setBrand} defaults={TEMPLATE_BRAND} />
        </section>
      </div>
    </Modal>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)'
}
const hexInput: React.CSSProperties = {
  flex: 1, padding: '8px 12px', fontSize: 13, borderRadius: 12,
  border: '1px solid var(--border-default)',
  background: 'var(--bg-elevated-2)', color: 'var(--text-primary)',
  fontFamily: 'ui-monospace, monospace', boxSizing: 'border-box', minHeight: 40
}
const resetLink: React.CSSProperties = {
  background: 'none', border: 'none', color: 'var(--text-secondary)',
  fontSize: 12, cursor: 'pointer', textDecoration: 'underline'
}
const hintStyle: React.CSSProperties = {
  fontSize: 11, color: 'var(--text-secondary)'
}
