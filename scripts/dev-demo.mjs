/**
 * Start Next web + optional QVAC coach + optional Pears Hyperswarm sidecar.
 * Usage: node scripts/dev-demo.mjs
 */
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const children = []

function run (cmd, args, label) {
  const child = spawn(cmd, args, {
    stdio: 'inherit',
    shell: true,
    env: process.env
  })
  children.push(child)
  child.on('exit', (code) => {
    if (code && code !== 0) console.error(`[${label}] exited ${code}`)
  })
  return child
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
  require.resolve('hyperswarm')
  console.log('GoalTip demo: hyperswarm found — starting Pears sidecar on :3848')
  run('node', ['pears/server.mjs'], 'pears')
} catch {
  console.log('GoalTip demo: hyperswarm not installed — skip Pears.')
  console.log('  Pears: pnpm add hyperswarm')
}

function shutdown () {
  for (const c of children) c.kill('SIGINT')
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
