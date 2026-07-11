/**
 * Start Next web + optional QVAC coach + dual Pears Hyperswarm peers.
 * Usage: node scripts/dev-demo.mjs
 */
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const require = createRequire(import.meta.url)
const pearsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'pears')
const children = []

function run (cmd, args, label, env = {}) {
  const child = spawn(cmd, args, {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...env }
  })
  children.push(child)
  child.on('exit', (code) => {
    if (code && code !== 0) console.error(`[${label}] exited ${code}`)
  })
  return child
}

function startPears () {
  console.log('GoalTip demo: hyperswarm found — starting Pears peers :3848 + :3849')
  run('node', ['pears/server.mjs'], 'pears-a', { PEARS_PORT: '3848' })
  run('node', ['pears/server.mjs'], 'pears-b', { PEARS_PORT: '3849' })
}

console.log('GoalTip demo: starting web…')
run('pnpm', ['dev'], 'web')

try {
  require.resolve('@qvac/sdk')
  console.log('GoalTip demo: @qvac/sdk found — starting coach on :3847')
  run('node', ['coach/server.mjs'], 'coach')
} catch {
  console.log('GoalTip demo: @qvac/sdk not installed — skip coach.')
  console.log('  QVAC: pnpm add @qvac/sdk')
}

try {
  require.resolve('hyperswarm', { paths: [pearsDir] })
  startPears()
} catch {
  try {
    require.resolve('hyperswarm')
    startPears()
  } catch {
    console.log('GoalTip demo: hyperswarm not installed — skip Pears.')
    console.log('  Pears: cd pears && npm install')
  }
}

function shutdown () {
  for (const c of children) c.kill('SIGINT')
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
