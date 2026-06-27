import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// App-level unit tests for the template's wallet utilities. These are pure
// (no worklet / no DOM), so a node environment is enough — they close the
// "0 app-level tests" gap the parity review flagged.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
})
