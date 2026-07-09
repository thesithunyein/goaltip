import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ServiceWorkerRegister } from '@/components/service-worker-register'

export const metadata: Metadata = {
  title: 'GoalTip — Self-Custodial Football Fan Tipping',
  description: 'Self-custodial USDT fan tipping for football watch parties. Built with Tether WDK for the Developers Cup.',
  applicationName: 'GoalTip',
  icons: {
    icon: [
      { url: '/goaltip-mark.svg?v=20260709', type: 'image/svg+xml' },
      { url: '/goaltip-mark.png', type: 'image/png', sizes: '512x512' }
    ],
    shortcut: '/goaltip-mark.svg?v=20260709',
    apple: '/goaltip-mark.png'
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'GoalTip' }
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
