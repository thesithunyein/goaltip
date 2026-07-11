'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button, Card, Input } from '@wdk-starter/wdk-ui'
import { getNation, NATIONS } from '@/lib/nations'
import { Screen } from './screen'

// Native <select> cannot show images; use name + ISO so Windows Chrome is readable.

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
    'var(--text-secondary, var(--text-dim, #b3a79f))'

  return (
    <Screen title="AI Coach">
      <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <p style={{ ...dim, margin: 0, flex: 1 }}>
            100% local AI via QVAC. No cloud, no API keys. Data never leaves your machine.
          </p>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '4px 8px',
            borderRadius: 999,
            border: `1px solid ${statusColor}`,
            color: statusColor,
            whiteSpace: 'nowrap'
          }}>
            {statusLabel}
          </span>
        </div>

        {online === false && (
          <div style={offlineBox}>
            <strong style={{ fontSize: 13 }}>Why offline on the live site?</strong>
            <p style={{ ...dim, fontSize: 12, margin: '6px 0 0' }}>
              QVAC runs on your device only. The Vercel deployment correctly cannot reach your localhost.
              For a live answer, run the coach server on this machine (steps below), then ask again.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <select value={nationA} onChange={(e) => setNationA(e.target.value)} style={selectStyle}>
            {NATIONS.map((n) => <option key={n.id} value={n.id}>{n.name} ({n.iso.toUpperCase()})</option>)}
          </select>
          <span style={{ alignSelf: 'center', color: 'var(--text-secondary, var(--text-dim))' }}>vs</span>
          <select value={nationB} onChange={(e) => setNationB(e.target.value)} style={selectStyle}>
            {NATIONS.map((n) => <option key={n.id} value={n.id}>{n.name} ({n.iso.toUpperCase()})</option>)}
          </select>
        </div>
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask the coach (optional)…"
        />
        <Button onClick={() => void askCoach()} disabled={busy} style={{ width: '100%' }}>
          {busy ? 'Thinking locally…' : 'Ask local coach'}
        </Button>
        <Button variant="outline" onClick={() => void checkCoach()} style={{ width: '100%' }}>
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
          style={{ fontSize: 13, color: 'var(--text-dim)' }}
        >
          <summary style={{ cursor: 'pointer' }}>How to run the local QVAC coach</summary>
          <ol style={{ margin: '10px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
            <li>In the repo root: <code>pnpm add @qvac/sdk</code></li>
            <li>Check your machine: <code>npx @qvac/sdk doctor</code></li>
            <li>Start the server: <code>npm run coach</code></li>
            <li>Keep this tab open on <code>localhost:3000</code> (or the live site) and tap Recheck</li>
          </ol>
          <pre style={codeBlock}>{`pnpm add @qvac/sdk
npx @qvac/sdk doctor
npm run coach
# Model: LLAMA 3.2 1B (on-device). First load may take a few minutes.`}</pre>
        </details>
      </Card>
    </Screen>
  )
}

const dim: React.CSSProperties = { margin: 0, color: 'var(--text-secondary, var(--text-dim, #b3a79f))', fontSize: 14, lineHeight: 1.5 }
const errorStyle: React.CSSProperties = { margin: 0, color: 'var(--color-error, #ef4444)', fontSize: 13 }
const answerBox: React.CSSProperties = {
  padding: 14, borderRadius: 16, background: 'var(--bg-elevated-2)',
  border: '1px solid var(--border-subtle)', fontSize: 14,
  color: 'var(--text-primary)'
}
const offlineBox: React.CSSProperties = {
  padding: 14, borderRadius: 16, background: 'color-mix(in srgb, var(--color-warning, #f59e0b) 12%, transparent)',
  border: '1px solid color-mix(in srgb, var(--color-warning, #f59e0b) 40%, transparent)'
}
const selectStyle: React.CSSProperties = {
  flex: 1, padding: '12px 10px', borderRadius: 14, minHeight: 44, minWidth: 0,
  border: '1px solid var(--border-default)',
  background: 'var(--bg-elevated-2)',
  color: 'var(--text-primary)', fontSize: 16
}
const codeBlock: React.CSSProperties = {
  margin: '8px 0 0', padding: 12, borderRadius: 14,
  background: 'var(--bg-elevated-3)',
  color: 'var(--text-primary)',
  overflow: 'auto', fontSize: 12
}
