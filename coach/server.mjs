/**
 * GoalTip local QVAC coach — runs on-device, never sends data to cloud AI.
 * Start with: npm run coach
 */
import http from 'node:http'

const PORT = 3847
let modelId = null
let qvac = null

const SYSTEM = `You are GoalTip Coach, a concise football analyst for watch-party fans.
Give short, actionable tips on which nation might win and why. Under 150 words.
Never mention cloud AI — you run locally on the user's device.`

async function ensureModel () {
  if (modelId) return modelId
  if (!qvac) {
    try {
      qvac = await import('@qvac/sdk')
    } catch {
      throw new Error('Install the optional QVAC coach dependency first: pnpm add @qvac/sdk')
    }
  }
  console.log('Loading QVAC model (first request may take a few minutes)…')
  modelId = await qvac.loadModel({
    modelSrc: qvac.LLAMA_3_2_1B_INST_Q4_0,
    onProgress: (p) => process.stderr.write(`\rLoading ${p.percentage?.toFixed(0) ?? 0}%`)
  })
  process.stderr.write('\nModel ready.\n')
  return modelId
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true, qvac: true }))
    return
  }

  if (req.method === 'POST' && req.url === '/coach') {
    let body = ''
    for await (const chunk of req) body += chunk
    let prompt = 'Who should I tip tonight?'
    try { prompt = JSON.parse(body).prompt ?? prompt } catch { /* use default */ }

    try {
      const id = await ensureModel()
      const result = qvac.completion({
        modelId: id,
        history: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: prompt }
        ],
        stream: false
      })
      const text = await result.text
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ answer: text }))
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }))
    }
    return
  }

  res.writeHead(404); res.end('Not found')
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`GoalTip QVAC coach listening on http://127.0.0.1:${PORT}`)
})

process.on('SIGINT', async () => {
  if (modelId && qvac) await qvac.unloadModel({ modelId })
  process.exit(0)
})
