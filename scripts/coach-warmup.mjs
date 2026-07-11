/**
 * Preload QVAC model so the first Coach ask is fast on camera.
 * Usage: pnpm add @qvac/sdk && npm run coach  (other terminal)
 *        node scripts/coach-warmup.mjs
 */

const PORT = 3847

async function main () {
  // Ensure coach is up
  try {
    const h = await fetch(`http://127.0.0.1:${PORT}/health`)
    if (!h.ok) throw new Error('not ok')
  } catch {
    console.error('Start the coach first: npm run coach')
    process.exit(1)
  }

  console.log('Warming QVAC coach (first load may take minutes)…')
  const res = await fetch(`http://127.0.0.1:${PORT}/coach`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'One sentence: who might win Myanmar vs Brazil?' })
  })
  const data = await res.json()
  if (!res.ok) {
    console.error(data)
    process.exit(1)
  }
  console.log('Ready. Sample answer:\n', data.answer)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
