/**
 * GoalTip Pears sidecar — Hyperswarm tip gossip for watch-party rooms.
 * Pears track: room tip announcements use Hyperswarm (not WebRTC).
 *
 * Start: pnpm add hyperswarm && npm run pears
 * Web UI talks to http://127.0.0.1:3848 (offline on Vercel by design).
 */
import http from 'node:http'
import crypto from 'node:crypto'
import { createRequire } from 'node:module'

const PORT = 3848
const require = createRequire(import.meta.url)

/** @type {Map<string, { tips: object[], peers: number, swarm?: any }>} */
const rooms = new Map()

function topicFor (code) {
  return crypto.createHash('sha256').update(`goaltip-party:${String(code).toUpperCase()}`).digest()
}

async function ensureHyperswarm () {
  try {
    return (await import('hyperswarm')).default
  } catch {
    try {
      return require('hyperswarm')
    } catch {
      throw new Error('Install Hyperswarm first: pnpm add hyperswarm')
    }
  }
}

async function joinRoom (code) {
  const key = String(code).toUpperCase()
  let room = rooms.get(key)
  if (room?.swarm) return room

  const Hyperswarm = await ensureHyperswarm()
  const swarm = new Hyperswarm()
  room = { tips: room?.tips ?? [], peers: 0, swarm }
  rooms.set(key, room)

  swarm.on('connection', (conn) => {
    room.peers += 1
    conn.on('close', () => { room.peers = Math.max(0, room.peers - 1) })
    conn.on('data', (buf) => {
      try {
        const msg = JSON.parse(Buffer.from(buf).toString('utf8'))
        if (msg?.type === 'tip' && msg.tip?.hash) {
          const exists = room.tips.some((t) => t.hash?.toLowerCase() === msg.tip.hash.toLowerCase())
          if (!exists) room.tips.unshift(msg.tip)
        }
      } catch { /* ignore */ }
    })
    // Share recent tips with new peer
    for (const tip of room.tips.slice(0, 20)) {
      try { conn.write(JSON.stringify({ type: 'tip', tip })) } catch { /* ignore */ }
    }
  })

  const discovery = swarm.join(topicFor(key), { server: true, client: true })
  await discovery.flushed().catch(() => {})
  return room
}

function broadcast (code, tip) {
  const room = rooms.get(String(code).toUpperCase())
  if (!room?.swarm) return
  const payload = Buffer.from(JSON.stringify({ type: 'tip', tip }), 'utf8')
  for (const conn of room.swarm.connections) {
    try { conn.write(payload) } catch { /* ignore */ }
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  if (req.method === 'GET' && req.url === '/health') {
    let hyperswarm = false
    try { await ensureHyperswarm(); hyperswarm = true } catch { /* missing */ }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true, pears: true, hyperswarm }))
    return
  }

  if (req.method === 'POST' && req.url === '/join') {
    let body = ''
    for await (const c of req) body += c
    try {
      const { code } = JSON.parse(body)
      if (!code) throw new Error('code required')
      const room = await joinRoom(code)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true, code: String(code).toUpperCase(), peers: room.peers }))
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }))
    }
    return
  }

  if (req.method === 'POST' && req.url === '/announce') {
    let body = ''
    for await (const c of req) body += c
    try {
      const { code, tip } = JSON.parse(body)
      if (!code || !tip?.hash) throw new Error('code and tip.hash required')
      const room = await joinRoom(code)
      const exists = room.tips.some((t) => t.hash?.toLowerCase() === tip.hash.toLowerCase())
      if (!exists) room.tips.unshift(tip)
      broadcast(code, tip)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true, peers: room.peers }))
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }))
    }
    return
  }

  const statusMatch = req.url?.match(/^\/status\/([A-Za-z0-9]+)$/)
  if (req.method === 'GET' && statusMatch) {
    const code = statusMatch[1].toUpperCase()
    const room = rooms.get(code)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      ok: true,
      code,
      joined: Boolean(room?.swarm),
      peers: room?.peers ?? 0,
      tips: room?.tips?.length ?? 0
    }))
    return
  }

  res.writeHead(404)
  res.end('Not found')
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`GoalTip Pears (Hyperswarm) sidecar on http://127.0.0.1:${PORT}`)
})
