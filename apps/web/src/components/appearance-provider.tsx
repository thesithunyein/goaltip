'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  WdkThemeProvider, BrandProvider,
  useThemePicker, useBrandPicker, useCustomPrimary,
  goaltipSoftLightTheme, clearStoredThemePrefs,
  type WdkTheme, type BrandConfig
} from '@wdk-starter/wdk-ui'

/** Cache-busted so browser tab + header always pick up the latest mark. */
export const GOALTIP_MARK_SRC = '/goaltip-mark.svg?v=20260709b'

const SOFT_LIGHT_MIGRATION_KEY = 'goaltip-soft-light-v2'

/**
 * The template's out-of-the-box brand. A fork rebrands either by editing this
 * constant (build-time default) or live via the in-app Appearance panel
 * (runtime, persisted to localStorage). Assets live in apps/web/public/.
 */
export const TEMPLATE_BRAND: BrandConfig = {
  name: 'GoalTip',
  markSrc: GOALTIP_MARK_SRC,
  markAlt: 'GoalTip',
  wordmarkSrc: undefined,
  wordmarkAlt: 'GoalTip'
}

/**
 * Keep Soft Light surfaces when the Appearance picker sets light mode.
 * ThemePicker's composeTheme swaps in a generic light palette — that wiped
 * GoalTip Soft Light and made Party/Settings look off vs Wallet.
 */
export function withSoftLightSurfaces (theme: WdkTheme, primaryOverride?: string | null): WdkTheme {
  if (theme.mode !== 'light') return theme
  const primary = (primaryOverride ?? theme.colors.primary).toUpperCase()
  const isBrandOrange = primary === '#F4642F'
  return {
    ...goaltipSoftLightTheme,
    colors: {
      ...goaltipSoftLightTheme.colors,
      primary: primaryOverride ?? theme.colors.primary,
      primaryHover: isBrandOrange ? goaltipSoftLightTheme.colors.primaryHover : (primaryOverride ?? theme.colors.primary),
      primaryActive: isBrandOrange ? goaltipSoftLightTheme.colors.primaryActive : (primaryOverride ?? theme.colors.primary)
    },
    radius: theme.radius,
    fonts: goaltipSoftLightTheme.fonts,
    motion: goaltipSoftLightTheme.motion,
    glass: 'off',
    mode: 'light'
  }
}

interface AppearanceValue {
  theme: WdkTheme
  setTheme: (t: WdkTheme) => void
  /** Arbitrary hex primary override (#RRGGBB) or null to use the swatch. */
  customPrimary: string | null
  setCustomPrimary: (hex: string | null) => void
  brand: BrandConfig
  setBrand: (b: BrandConfig) => void
  /** Whether the Appearance settings panel is open. */
  open: boolean
  setOpen: (o: boolean) => void
  /** Restore Soft Light + GoalTip brand (demo-safe default). */
  resetSoftLight: () => void
}

const AppearanceContext = createContext<AppearanceValue | null>(null)

export function AppearanceProvider ({ children }: { children: React.ReactNode }) {
  const [theme, setThemeRaw] = useThemePicker(goaltipSoftLightTheme)
  const [customPrimary, setCustomPrimary] = useCustomPrimary()
  const [brand, setBrand] = useBrandPicker(TEMPLATE_BRAND)
  const [open, setOpen] = useState(false)

  const setTheme = useCallback((next: WdkTheme) => {
    setThemeRaw(next.mode === 'light' ? withSoftLightSurfaces(next, null) : next)
  }, [setThemeRaw])

  const resetSoftLight = useCallback(() => {
    clearStoredThemePrefs()
    setCustomPrimary(null)
    setThemeRaw(goaltipSoftLightTheme)
    setBrand(TEMPLATE_BRAND)
    try {
      window.localStorage.setItem(SOFT_LIGHT_MIGRATION_KEY, '1')
    } catch { /* ignore */ }
  }, [setThemeRaw, setCustomPrimary, setBrand])

  // Drop stale Appearance-panel logos (old WDK mark / cached SVG without ?v=).
  useEffect(() => {
    const src = brand.markSrc ?? ''
    if (!src.includes('goaltip-mark.svg') || src !== GOALTIP_MARK_SRC) {
      setBrand(TEMPLATE_BRAND)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Force Soft Light once so judges / demo devices don't keep an old dark pref.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(SOFT_LIGHT_MIGRATION_KEY) === '1') return
      resetSoftLight()
    } catch {
      setThemeRaw(goaltipSoftLightTheme)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const effectiveTheme = useMemo(() => {
    if (theme.mode === 'light') return withSoftLightSurfaces(theme, customPrimary)
    if (!customPrimary) return theme
    return {
      ...theme,
      colors: {
        ...theme.colors,
        primary: customPrimary,
        primaryHover: customPrimary,
        primaryActive: customPrimary
      }
    }
  }, [theme, customPrimary])

  const value = useMemo<AppearanceValue>(() => ({
    theme: effectiveTheme,
    setTheme,
    customPrimary,
    setCustomPrimary,
    brand,
    setBrand,
    open,
    setOpen,
    resetSoftLight
  }), [effectiveTheme, setTheme, customPrimary, setCustomPrimary, brand, setBrand, open, resetSoftLight])

  return (
    <AppearanceContext.Provider value={value}>
      <WdkThemeProvider theme={effectiveTheme}>
        <BrandProvider brand={brand}>{children}</BrandProvider>
      </WdkThemeProvider>
    </AppearanceContext.Provider>
  )
}

export function useAppearance (): AppearanceValue {
  const ctx = useContext(AppearanceContext)
  if (!ctx) throw new Error('useAppearance must be used within <AppearanceProvider>')
  return ctx
}
