import type { Meta, StoryObj } from '@storybook/react-vite'

import { within } from '@testing-library/react'
import { expect } from 'storybook/test'
import GameBoard from './GameBoard'
import { cssSelectorToRegEx } from './testLib/helpers'
import { withFullBoardGameStore } from './testLib/storybook/decorators'
import { getCellButton, selectNumber } from './testLib/storybook/helpers'

const meta = {
  title: 'Board/GameBoard',
  component: GameBoard,
  parameters: {
    layout: 'centered',
  },
  decorators: [withFullBoardGameStore],
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
