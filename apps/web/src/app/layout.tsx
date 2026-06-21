import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ServiceWorkerRegister } from '@/components/service-worker-register'

export const metadata: Metadata = {
  title: 'WDK Wallet Template',
  description: 'A self-custodial multi-chain wallet template built on Tether WDK and Next.js.',
  applicationName: 'WDK Wallet',
  icons: { icon: '/favicon.ico', apple: '/wdk-mark.png' },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'WDK Wallet' }
}

export const viewport: Viewport = {
  themeColor: '#161312',
  width: 'device-width',
  initialScale: 1
}

export default function RootLayout ({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
