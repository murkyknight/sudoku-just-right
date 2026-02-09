import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    environment: 'jsdom', // 'jsdom' if you test browser APIs/React components
    globals: true, // enables describe/test/it/expect as globals
    setupFiles: ['./vitest.setup.ts'], // enables testing libary globals
    unstubEnvs: true,

    // Two seperate projects so we can run quick unit test & heavier storybook tets seperatly in pipeline
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.{test,spec}.{ts,tsx,js,jsx}'],
          exclude: ['**/*.stories.*', '**/*.mdx', 'storybook-static', 'dist', 'node_modules'],
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./vitest.setup.ts', 'vitest-localstorage-mock'],
        },
      },
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [
              {
                browser: 'chromium',
              },
            ],
          },
          setupFiles: ['.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
  // Used to reference CSS class selectors in unit tests (jsdom) only like:
  // expect(button).toHaveClass('muted')
  resolve: {
    alias: {
      '@': path.resolve(dirname, 'src'),
      // CSS module mocks
      '\\.module\\.css$': 'identity-obj-proxy',
      '\\.module\\.scss$': 'identity-obj-proxy',
      '\\.module\\.sass$': 'identity-obj-proxy',
    },
  },
})