import type { Preview } from '@storybook/react-vite'
import { initialize, mswLoader } from 'msw-storybook-addon'
import { sb } from 'storybook/test'
import '../src/styles/global.css'

/*
 * Initializes MSW
 * See https://github.com/mswjs/msw-storybook-addon#configuring-msw
 * to learn how to customize it
 */
initialize()

// `sb` must be used here - does not work in story files.
// Spies on all functions of the passed file but won’t mock them until we explicitly do so in stories.
sb.mock(import('../src/components/DifficultySelector/helpers.ts'), { spy: true })

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
  loaders: [mswLoader], // 👈 Add the MSW loader to all stories
}

export default preview
