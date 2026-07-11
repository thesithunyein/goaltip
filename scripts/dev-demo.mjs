/**
 * Start Next web + optional QVAC coach together for Cup demos.
 * Usage: node scripts/dev-demo.mjs
 */
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

function run (cmd, args, label) {
  const child = spawn(cmd, args, {
    stdio: 'inherit',
    shell: true,
    env: process.env
  })
  child.on('exit', (code) => {
    if (code && code !== 0) console.error(`[${label}] exited ${code}`)
  })
  return child
}

console.log('GoalTip demo: starting web…')
const web = run('pnpm', ['dev'], 'web')

let coach = null
try {
  require.resolve('@qvac/sdk')
  console.log('GoalTip demo: @qvac/sdk found — starting coach on :3847')
  coach = run('node', ['coach/server.mjs'], 'coach')
} catch {
  console.log('GoalTip demo: @qvac/sdk not installed — web only.')
  console.log('  For QVAC track: pnpm add @qvac/sdk && node scripts/dev-demo.mjs')
}

function shutdown () {
  web.kill('SIGINT')
  coach?.kill('SIGINT')
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
