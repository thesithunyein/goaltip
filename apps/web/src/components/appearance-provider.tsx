'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  WdkThemeProvider, BrandProvider,
  useThemePicker, useBrandPicker, useCustomPrimary,
  goaltipSoftLightTheme, goaltipSoftDarkTheme, clearStoredThemePrefs,
  type WdkTheme, type BrandConfig
} from '@wdk-starter/wdk-ui'

/** Cache-busted so browser tab + header always pick up the latest mark. */
export const GOALTIP_MARK_SRC = '/goaltip-mark.svg?v=20260709b'

const SOFT_LIGHT_MIGRATION_KEY = 'goaltip-soft-light-v5'

export const TEMPLATE_BRAND: BrandConfig = {
  name: 'GoalTip',
  markSrc: GOALTIP_MARK_SRC,
  markAlt: 'GoalTip',
  wordmarkSrc: undefined,
  wordmarkAlt: 'GoalTip'
}

function withPrimary (base: WdkTheme, primaryOverride?: string | null): WdkTheme {
  if (!primaryOverride) return base
  const primary = primaryOverride.toUpperCase()
  const isBrandOrange = primary === '#F4642F'
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: primaryOverride,
      primaryHover: isBrandOrange ? base.colors.primaryHover : primaryOverride,
      primaryActive: isBrandOrange ? base.colors.primaryActive : primaryOverride
    }
  }
}

/**
 * Map Appearance picker mode onto GoalTip Soft Light / Soft Dark so both
 * modes stay readable and consistent with Wallet.
 */
export function withGoalTipSurfaces (theme: WdkTheme, primaryOverride?: string | null): WdkTheme {
  const base = theme.mode === 'dark' ? goaltipSoftDarkTheme : goaltipSoftLightTheme
  return {
    ...withPrimary(base, primaryOverride),
    radius: theme.radius,
    mode: theme.mode === 'dark' ? 'dark' : 'light'
  }
}

interface AppearanceValue {
  theme: WdkTheme
  setTheme: (t: WdkTheme) => void
  customPrimary: string | null
  setCustomPrimary: (hex: string | null) => void
  brand: BrandConfig
  setBrand: (b: BrandConfig) => void
  open: boolean
  setOpen: (o: boolean) => void
  resetSoftLight: () => void
}

const AppearanceContext = createContext<AppearanceValue | null>(null)

export function AppearanceProvider ({ children }: { children: React.ReactNode }) {
  const [theme, setThemeRaw] = useThemePicker(goaltipSoftLightTheme)
  const [customPrimary, setCustomPrimary] = useCustomPrimary()
  const [brand, setBrand] = useBrandPicker(TEMPLATE_BRAND)
  const [open, setOpen] = useState(false)

  const setTheme = useCallback((next: WdkTheme) => {
    setThemeRaw(withGoalTipSurfaces(next, null))
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

  useEffect(() => {
    const src = brand.markSrc ?? ''
    if (!src.includes('goaltip-mark.svg') || src !== GOALTIP_MARK_SRC) {
      setBrand(TEMPLATE_BRAND)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    try {
      if (window.localStorage.getItem(SOFT_LIGHT_MIGRATION_KEY) === '1') return
      resetSoftLight()
    } catch {
      setThemeRaw(goaltipSoftLightTheme)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const effectiveTheme = useMemo(
    () => withGoalTipSurfaces(theme, customPrimary),
    [theme, customPrimary]
  )

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
