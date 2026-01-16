import type { Preview } from '@storybook/react-vite'

import 'open-props/animations.min.css'
import 'open-props/aspects.min.css'
import 'open-props/borders.min.css'
import 'open-props/colors.min.css'
import 'open-props/easings.min.css'
import 'open-props/shadows.min.css'
import '../src/styles/global.css'

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
}

export default preview
