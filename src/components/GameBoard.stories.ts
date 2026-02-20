import type { Meta, StoryObj } from '@storybook/react-vite'

import { within } from '@testing-library/react'
import { expect, mocked } from 'storybook/test'
import { getXRandomUniqueNumbers } from './DifficultySelector/helpers'
import GameBoard from './GameBoard'
import { cssSelectorToRegEx, resetGameStore } from './testLib/helpers'
import { handlers } from './testLib/msw/handlers'
import { getCellButton, selectNumber } from './testLib/storybook/helpers'

const meta = {
  title: 'Board/GameBoard',
  component: GameBoard,
  beforeEach() {
    resetGameStore()
    mocked(getXRandomUniqueNumbers).mockReturnValue([0, 1, 2, 3, 4])
  },
  parameters: {
    layout: 'centered',
    msw: {
      handlers,
    },
  },
} satisfies Meta<typeof GameBoard>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const MultiUnitConflict: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const cellIndex = 1
    const placedValue = '8'
    const cell = getCellButton(canvas, cellIndex)

    await selectNumber(cell, placedValue)

    const expectedConflictColumnCellIndex = 37
    const expectedConflictRowCellIndex = 8
    const expectedConflictBoxCellIndex = 9
    const colConflict = getCellButton(canvas, expectedConflictColumnCellIndex)
    const rowConflict = getCellButton(canvas, expectedConflictRowCellIndex)
    const boxConflict = getCellButton(canvas, expectedConflictBoxCellIndex)
    await expect(cell).toHaveClass(cssSelectorToRegEx('conflicted'))
    await expect(colConflict).toHaveClass(cssSelectorToRegEx('conflicted'))
    await expect(rowConflict).toHaveClass(cssSelectorToRegEx('conflicted'))
    await expect(boxConflict).toHaveClass(cssSelectorToRegEx('conflicted'))
  },
}
