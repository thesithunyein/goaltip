export interface Nation {
  readonly id: string
  readonly name: string
  readonly flag: string
}

/** Nations for watch-party tipping battles — Tether Developers Cup theme. */
export const NATIONS: readonly Nation[] = [
  { id: 'mm', name: 'Myanmar', flag: '🇲🇲' },
  { id: 'br', name: 'Brazil', flag: '🇧🇷' },
  { id: 'ar', name: 'Argentina', flag: '🇦🇷' },
  { id: 'fr', name: 'France', flag: '🇫🇷' },
  { id: 'de', name: 'Germany', flag: '🇩🇪' },
  { id: 'es', name: 'Spain', flag: '🇪🇸' },
  { id: 'gb', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'pt', name: 'Portugal', flag: '🇵🇹' },
  { id: 'nl', name: 'Netherlands', flag: '🇳🇱' },
  { id: 'it', name: 'Italy', flag: '🇮🇹' },
  { id: 'ng', name: 'Nigeria', flag: '🇳🇬' },
  { id: 'jp', name: 'Japan', flag: '🇯🇵' },
  { id: 'kr', name: 'South Korea', flag: '🇰🇷' },
  { id: 'us', name: 'USA', flag: '🇺🇸' },
  { id: 'mx', name: 'Mexico', flag: '🇲🇽' },
  { id: 'co', name: 'Colombia', flag: '🇨🇴' },
] as const

export function getNation (id: string): Nation | undefined {
  return NATIONS.find((n) => n.id === id)
}
