'use client'

/* eslint-disable @next/next/no-img-element */

import { flagImageUrl, type Nation } from '@/lib/nations'

/** Renders a real flag image (Windows Chrome often blanks emoji flags). */
export function NationFlag ({
  nation,
  size = 28,
  title
}: {
  nation?: Pick<Nation, 'iso' | 'name' | 'flag'> | null
  size?: number
  title?: string
}): React.JSX.Element | null {
  if (!nation) return null
  const px = size <= 20 ? 20 : size <= 40 ? 40 : 80
  return (
    <img
      src={flagImageUrl(nation.iso, px)}
      alt={title ?? `${nation.name} flag`}
      width={size}
      height={Math.round(size * 0.75)}
      style={{
        width: size,
        height: Math.round(size * 0.75),
        objectFit: 'cover',
        borderRadius: 3,
        display: 'inline-block',
        verticalAlign: 'middle',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.12)'
      }}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  )
}
