import type { Meta, StoryObj } from '@storybook/react-vite'

import Box from './Box'
import { withFullBoardGameStore } from './testLib/storybook/decorators'

const meta = {
  title: 'Board/Box',
  component: Box,
  args: {
    index: 0,
  },
  decorators: [withFullBoardGameStore],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Box>

export default meta
type Story = StoryObj<typeof meta>

// TODO

export const Empty: Story = {}
