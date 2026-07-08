'use client'

import { useCallback, useState } from 'react'
import { Button, Card, Input } from '@wdk-starter/wdk-ui'
import { getNation, NATIONS } from '@/lib/nations'
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

  const askCoach = useCallback(async () => {
    setBusy(true)
    setError(null)
    setAnswer(null)
    const up = online ?? await checkCoach()
    if (!up) {
      setError('Local QVAC coach is offline. Run: npm run coach')
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
  }, [nationA, nationB, question, online, checkCoach])

  return (
    <Screen title="AI Coach">
      <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={dim}>
          100% local AI via QVAC — no cloud, no API keys. Run the coach server on your machine, then ask who to tip.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={nationA} onChange={(e) => setNationA(e.target.value)} style={selectStyle}>
            {NATIONS.map((n) => <option key={n.id} value={n.id}>{n.flag} {n.name}</option>)}
          </select>
          <span style={{ alignSelf: 'center', color: 'var(--text-dim)' }}>vs</span>
          <select value={nationB} onChange={(e) => setNationB(e.target.value)} style={selectStyle}>
            {NATIONS.map((n) => <option key={n.id} value={n.id}>{n.flag} {n.name}</option>)}
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
          Check coach status {online === true ? '✓ online' : online === false ? '✗ offline' : ''}
        </Button>
        {error && <p style={errorStyle}>{error}</p>}
        {answer && (
          <div style={answerBox}>
            <strong>Coach says:</strong>
            <p style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{answer}</p>
          </div>
        )}
        <details style={{ fontSize: 13, color: 'var(--text-dim)' }}>
          <summary>Setup local coach</summary>
          <pre style={codeBlock}>{`npm install
npm run coach
# Requires Node 22+ and QVAC-compatible GPU (4.5GB+ VRAM for 1B model)`}</pre>
        </details>
      </Card>
    </Screen>
  )
}

const dim: React.CSSProperties = { margin: 0, color: 'var(--text-dim, #b3a79f)', fontSize: 14, lineHeight: 1.5 }
const errorStyle: React.CSSProperties = { margin: 0, color: '#ef4444', fontSize: 13 }
const answerBox: React.CSSProperties = {
  padding: 12, borderRadius: 8, background: 'var(--surface-2, #241f1c)',
  border: '1px solid var(--border, #332c28)', fontSize: 14
}
const selectStyle: React.CSSProperties = {
  flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #332c28)',
  background: 'var(--surface-2, #241f1c)', color: 'var(--text, #f7eee8)', fontSize: 13
}
const codeBlock: React.CSSProperties = {
  margin: '8px 0 0', padding: 12, borderRadius: 8, background: '#0e0c0b',
  overflow: 'auto', fontSize: 12
}
