import type { Meta, StoryObj } from '@storybook/react-vite'

import DifficultySelector from './DifficultySelector'

const meta = {
  title: 'Board/DifficultySelector',
  component: DifficultySelector,
  parameters: {
    layout: 'centered',
  },
  decorators: [],
} satisfies Meta<typeof DifficultySelector>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
