import type { MetadataRoute } from 'next'

/**
 * PWA web app manifest (served at /manifest.webmanifest, auto-linked by Next).
 * Makes the wallet installable to the home screen / desktop. Swap the icons and
 * names when you fork — add 192×192 and 512×512 PNGs for the richest install UX
 * (the bundled mark is 256×256).
 */
export default function manifest (): MetadataRoute.Manifest {
  return {
    name: 'GoalTip',
    short_name: 'GoalTip',
    description: 'Self-custodial USDt fan tipping for football watch parties, built on Tether WDK.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#161312',
    theme_color: '#161312',
    icons: [
      { src: '/goaltip-mark.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/goaltip-mark.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }
    ]
  }
}
