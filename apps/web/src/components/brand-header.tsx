'use client'

/* eslint-disable @next/next/no-img-element */

import { useBrand } from '@wdk-starter/wdk-ui'

/** Header brand lockup — reads the live brand identity from BrandProvider, so
 *  the in-app Appearance panel (or a fork's TEMPLATE_BRAND) re-skins it. */
export function BrandHeader () {
  const brand = useBrand()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {brand.markSrc && (
        <img
          src={brand.markSrc}
          alt={brand.markAlt ?? brand.name}
          width={40}
          height={40}
          style={{
            borderRadius: 14,
            boxShadow: '0 4px 14px rgba(17,24,39,0.08)',
            background: 'var(--bg-elevated-1, #fff)'
          }}
        />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
        <strong style={{ fontSize: 17, letterSpacing: -0.3 }}>{brand.name}</strong>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Self-custodial fan tipping</span>
      </div>
    </div>
  )
}
