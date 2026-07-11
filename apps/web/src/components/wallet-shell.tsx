'use client'

/**
 * GoalTip shell — football watch party + self-custodial WDK wallet.
 */

import { useState } from 'react'
import { Button, Card, TabBar, type TabItem } from '@wdk-starter/wdk-ui'
import { useWallet } from '@/wallet/wallet-provider'
import { Dashboard } from './dashboard'
import { Activity } from './activity'
import { Screen } from './screen'
import { WatchPartyScreen } from './watch-party-screen'
import { CoachScreen } from './coach-screen'
import { AppearanceDialog } from './appearance-dialog'
import { useAppearance } from './appearance-provider'
import { ActivityIcon, CoachIcon, PartyIcon, SettingsIcon, WalletIcon } from './tab-icons'

type TabId = 'party' | 'wallet' | 'coach' | 'activity' | 'settings'

const TABS: readonly TabItem[] = [
  { id: 'party', label: 'Party', icon: <PartyIcon /> },
  { id: 'wallet', label: 'Wallet', icon: <WalletIcon /> },
  { id: 'coach', label: 'Coach', icon: <CoachIcon /> },
  { id: 'activity', label: 'Activity', icon: <ActivityIcon /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon /> }
]

export function WalletShell ({ initialTab = 'party' }: { initialTab?: TabId } = {}): React.JSX.Element {
  const [tab, setTab] = useState<TabId>(initialTab)
  const { open: appearanceOpen } = useAppearance()

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base, #f2f3f5)', color: 'var(--text-primary)' }}>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ width: '100%', maxWidth: 460, minWidth: 0 }}>
          {tab === 'party' && <WatchPartyScreen />}
          {tab === 'wallet' && <Dashboard />}
          {tab === 'coach' && <CoachScreen />}
          {tab === 'activity' && <Screen title="Activity"><Activity /></Screen>}
          {tab === 'settings' && <SettingsTab />}
        </div>
      </div>
      <div className="goaltip-tabbar">
        <TabBar tabs={TABS} active={tab} onChange={(id) => setTab(id as TabId)} sticky={false} aria-label="GoalTip" />
      </div>
      {appearanceOpen && <AppearanceDialog />}
    </div>
  )
}

function SettingsTab (): React.JSX.Element {
  const { address, accountIndex, lock } = useWallet()
  const { setOpen: setAppearanceOpen } = useAppearance()
  return (
    <Screen title="Settings">
      <Card padding="lg" variant="elevated" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Row label="Account" value={`Account ${accountIndex + 1}`} />
        {address && <Row label="Address" value={`${address.slice(0, 6)}…${address.slice(-4)}`} mono />}
        <Button variant="secondary" onClick={() => setAppearanceOpen(true)} style={{ width: '100%' }}>Appearance</Button>
        <Button variant="outline" onClick={() => void lock()} style={{ width: '100%' }}>Lock wallet</Button>
      </Card>
      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary, #b3a79f)' }}>
        GoalTip · self-custodial · keys in Web Worker · built on Tether WDK
      </p>
    </Screen>
  )
}

function Row ({ label, value, mono = false }: { label: string, value: string, mono?: boolean }): React.JSX.Element {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
      <span style={{ color: 'var(--text-secondary, #b3a79f)' }}>{label}</span>
      <span style={mono ? { fontFamily: 'ui-monospace, monospace' } : undefined}>{value}</span>
    </div>
  )
}
