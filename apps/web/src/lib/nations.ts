export interface Nation {
  readonly id: string
  readonly name: string
  /** ISO 3166-1 alpha-2 (or gb-eng) for flagcdn images — Windows Chrome often blanks emoji flags. */
  readonly iso: string
  readonly flag: string
}

/** Nations for watch-party tipping battles — Tether Developers Cup theme. */
export const NATIONS: readonly Nation[] = [
  { id: 'mm', name: 'Myanmar', iso: 'mm', flag: '🇲🇲' },
  { id: 'br', name: 'Brazil', iso: 'br', flag: '🇧🇷' },
  { id: 'ar', name: 'Argentina', iso: 'ar', flag: '🇦🇷' },
  { id: 'fr', name: 'France', iso: 'fr', flag: '🇫🇷' },
  { id: 'de', name: 'Germany', iso: 'de', flag: '🇩🇪' },
  { id: 'es', name: 'Spain', iso: 'es', flag: '🇪🇸' },
  { id: 'gb', name: 'England', iso: 'gb-eng', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'pt', name: 'Portugal', iso: 'pt', flag: '🇵🇹' },
  { id: 'nl', name: 'Netherlands', iso: 'nl', flag: '🇳🇱' },
  { id: 'it', name: 'Italy', iso: 'it', flag: '🇮🇹' },
  { id: 'ng', name: 'Nigeria', iso: 'ng', flag: '🇳🇬' },
  { id: 'jp', name: 'Japan', iso: 'jp', flag: '🇯🇵' },
  { id: 'kr', name: 'South Korea', iso: 'kr', flag: '🇰🇷' },
  { id: 'us', name: 'USA', iso: 'us', flag: '🇺🇸' },
  { id: 'mx', name: 'Mexico', iso: 'mx', flag: '🇲🇽' },
  { id: 'co', name: 'Colombia', iso: 'co', flag: '🇨🇴' },
] as const

export function getNation (id: string): Nation | undefined {
  return NATIONS.find((n) => n.id === id)
}

export function flagImageUrl (iso: string, width = 40): string {
  return `https://flagcdn.com/w${width}/${iso}.png`
}
