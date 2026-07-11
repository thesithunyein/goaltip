'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button, Card, Input } from '@wdk-starter/wdk-ui'
import { getNation, NATIONS } from '@/lib/nations'
import { getParty, nationTotals } from '@/lib/party-store'
import { softCardStyle, softDim, softPillBtn } from '@/lib/soft-ui'
import { Screen } from './screen'

const COACH_URL = 'http://127.0.0.1:3847'

export function CoachScreen (): React.JSX.Element {
  const [nationA, setNationA] = useState('mm')
  const [nationB, setNationB] = useState('br')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [online, setOnline] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [setupOpen, setSetupOpen] = useState(false)
  const [roomHint, setRoomHint] = useState<string | null>(null)

  // Sync Coach with the active Party room so WDK + QVAC feel like one product.
  useEffect(() => {
    const party = getParty()
    if (!party) {
      setRoomHint(null)
      return
    }
    setNationA(party.nationA)
    setNationB(party.nationB)
    const totals = nationTotals(party)
    const a = getNation(party.nationA)
    const b = getNation(party.nationB)
    const ta = (totals.get(party.nationA) ?? 0).toFixed(2)
    const tb = (totals.get(party.nationB) ?? 0).toFixed(2)
    setRoomHint(`Room ${party.code}: ${a?.name ?? party.nationA} ${ta} USDt vs ${b?.name ?? party.nationB} ${tb} USDt (verified)`)
    setQuestion(
      `Watch party ${party.code}. Verified tips: ${a?.name ?? party.nationA} ${ta} USDt vs ${b?.name ?? party.nationB} ${tb} USDt. Who should I tip next and why? Keep it under 120 words.`
    )
  }, [])

  const checkCoach = useCallback(async () => {
    try {
      const res = await fetch(`${COACH_URL}/health`, { signal: AbortSignal.timeout(2000) })
      setOnline(res.ok)
      return res.ok
    } catch {
      setOnline(false)
      return false
    }
  }, [])

  useEffect(() => {
    void checkCoach()
  }, [checkCoach])

  const askCoach = useCallback(async () => {
    setBusy(true)
    setError(null)
    setAnswer(null)
    const up = await checkCoach()
    if (!up) {
      setError('Local QVAC coach is offline. Start it on this machine (setup below), then try again.')
      setSetupOpen(true)
      setBusy(false)
      return
    }
    const a = getNation(nationA)
    const b = getNation(nationB)
    const prompt = question.trim() || `Who should I tip for ${a?.name} vs ${b?.name}? Give a short football analysis.`
    try {
      const res = await fetch(`${COACH_URL}/coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json() as { answer: string }
      setAnswer(data.answer)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Coach request failed.')
    } finally {
      setBusy(false)
    }
  }, [nationA, nationB, question, checkCoach])

  const statusLabel =
    online === true ? 'Online (local)' :
    online === false ? 'Offline (expected on Vercel)' :
    'Checking…'

  const statusColor =
    online === true ? 'var(--color-success, #22c55e)' :
    online === false ? 'var(--color-warning, #f59e0b)' :
    'var(--text-secondary)'

  return (
    <Screen title="AI Coach" subtitle="On-device QVAC — no cloud, no API keys">
      <Card padding="lg" variant="elevated" style={softCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <p style={{ ...softDim, flex: 1 }}>Ask who to tip for tonight&apos;s match.</p>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 999,
            border: `1px solid ${statusColor}`, color: statusColor, whiteSpace: 'nowrap'
          }}>
            {statusLabel}
          </span>
        </div>

        {roomHint && (
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--color-primary)' }}>
            Linked to Party · {roomHint}
          </p>
        )}

        {online === false && (
          <div style={offlineBox}>
            <strong style={{ fontSize: 13 }}>Why offline on the live site?</strong>
            <p style={{ ...softDim, fontSize: 12, margin: '6px 0 0' }}>
              QVAC runs on your device only — required for the Cup multi-track demo.
              On your recording machine: <code>pnpm add @qvac/sdk && pnpm demo</code>, then Recheck.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <select value={nationA} onChange={(e) => setNationA(e.target.value)} style={selectStyle}>
            {NATIONS.map((n) => <option key={n.id} value={n.id}>{n.name} ({n.iso.toUpperCase()})</option>)}
          </select>
          <span style={{ alignSelf: 'center', color: 'var(--text-secondary)', fontWeight: 700 }}>vs</span>
          <select value={nationB} onChange={(e) => setNationB(e.target.value)} style={selectStyle}>
            {NATIONS.map((n) => <option key={n.id} value={n.id}>{n.name} ({n.iso.toUpperCase()})</option>)}
          </select>
        </div>
        <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask the coach…" style={{ borderRadius: 14, minHeight: 44 }} />
        <Button onClick={() => void askCoach()} disabled={busy} style={{ width: '100%', ...softPillBtn, minHeight: 48 }}>
          {busy ? 'Thinking locally…' : 'Ask local coach'}
        </Button>
        <Button variant="outline" onClick={() => void checkCoach()} style={{ width: '100%', ...softPillBtn }}>
          Recheck coach status
        </Button>
        {error && <p style={errorStyle}>{error}</p>}
        {answer && (
          <div style={answerBox}>
            <strong>Coach says:</strong>
            <p style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{answer}</p>
          </div>
        )}

        <details
          open={setupOpen || online === false}
          onToggle={(e) => setSetupOpen((e.target as HTMLDetailsElement).open)}
          style={{ fontSize: 13, color: 'var(--text-secondary)' }}
        >
          <summary style={{ cursor: 'pointer' }}>How to run the local QVAC coach</summary>
          <ol style={{ margin: '10px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
            <li><code>pnpm add @qvac/sdk</code></li>
            <li><code>npx @qvac/sdk doctor</code></li>
            <li><code>pnpm demo</code> (or <code>npm run coach</code>)</li>
            <li>Stay on localhost and tap Recheck</li>
          </ol>
          <pre style={codeBlock}>{`pnpm add @qvac/sdk
npx @qvac/sdk doctor
pnpm demo`}</pre>
        </details>
      </Card>
    </Screen>
  )
}

const errorStyle: React.CSSProperties = { margin: 0, color: 'var(--color-error, #ef4444)', fontSize: 13 }
const answerBox: React.CSSProperties = {
  padding: 14, borderRadius: 18, background: 'var(--bg-elevated-2)',
  border: '1px solid var(--border-subtle)', fontSize: 14, color: 'var(--text-primary)'
}
const offlineBox: React.CSSProperties = {
  padding: 14, borderRadius: 18,
  background: 'color-mix(in srgb, var(--color-warning, #f59e0b) 12%, transparent)',
  border: '1px solid color-mix(in srgb, var(--color-warning, #f59e0b) 40%, transparent)'
}
const selectStyle: React.CSSProperties = {
  flex: 1, padding: '12px 10px', borderRadius: 14, minHeight: 44, minWidth: 0,
  border: '1px solid var(--border-default)', background: 'var(--bg-elevated-2)',
  color: 'var(--text-primary)', fontSize: 16
}
const codeBlock: React.CSSProperties = {
  margin: '8px 0 0', padding: 12, borderRadius: 14,
  background: 'var(--bg-elevated-3)', color: 'var(--text-primary)', overflow: 'auto', fontSize: 12
}
