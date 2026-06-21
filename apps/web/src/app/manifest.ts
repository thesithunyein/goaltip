import type { MetadataRoute } from 'next'

/**
 * PWA web app manifest (served at /manifest.webmanifest, auto-linked by Next).
 * Makes the wallet installable to the home screen / desktop. Swap the icons and
 * names when you fork — add 192×192 and 512×512 PNGs for the richest install UX
 * (the bundled mark is 256×256).
 */
export default function manifest (): MetadataRoute.Manifest {
  return {
    name: 'WDK Wallet Template',
    short_name: 'WDK Wallet',
    description: 'A self-custodial multi-chain wallet built on Tether WDK and Next.js.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#161312',
    theme_color: '#161312',
    icons: [
      { src: '/wdk-mark.png', sizes: '256x256', type: 'image/png', purpose: 'any' },
      { src: '/wdk-mark.png', sizes: '256x256', type: 'image/png', purpose: 'maskable' }
    ]
  }
}
