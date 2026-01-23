import type { Meta, StoryObj } from '@storybook/react-vite'

import type { within } from '@testing-library/react'
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

type Canvas = ReturnType<typeof within>

export default meta
type Story = StoryObj<typeof meta>

// TODO

export const Empty: Story = {
  play: async ({ canvasElement }) => {},
}
