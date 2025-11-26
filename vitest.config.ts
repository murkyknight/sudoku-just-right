import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom', // 'jsdom' if you test browser APIs/React components
    globals: true, // enables describe/test/it/expect as globals
    setupFiles: ['./vitest.setup.ts'], // enables testing libary globals
  },
})