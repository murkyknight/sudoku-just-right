import type { Meta, StoryObj } from '@storybook/react-vite'

import type { RootManifest, VersionManifest } from '@/types'
// import { within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
// import { expect, mocked } from 'storybook/test'
// import { getXRandomUniqueNumbers } from './DifficultySelector/helpers'
import GameBoard from './GameBoard'
import { createRootManifest, cssSelectorToRegEx, generatePuzzleSources } from './testLib/helpers'
import { withFullBoardGameStore } from './testLib/storybook/decorators'
// import { getCellButton, selectNumber } from './testLib/storybook/helpers'

const meta = {
  title: 'Board/GameBoard',
  component: GameBoard,
  parameters: {
    layout: 'centered',
    msw: {
      // TODO: pull these into helper handler functions so we can reuse - or better make some default handler function
      handlers: [
        http.get('https://sjr-puzzles.pages.dev/manifest.json', () => {
          return HttpResponse.json(rootManiDefault)
        }),
        http.get('https://sjr-puzzles.pages.dev/v1/manifestPath/manifest.json', () => {
          return HttpResponse.json(defaultVersionManifest)
        }),
        http.get('https://sjr-puzzles.pages.dev/sudoku/v1/easy/*', () => {
          return HttpResponse.json(generatePuzzleSources(5))
        }),
      ],
    },
  },
  decorators: [withFullBoardGameStore],
} satisfies Meta<typeof GameBoard>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

// `${BASE_URL}/manifest.json`

const rootManiDefault: RootManifest = createRootManifest('v1')

// `${BASE_URL}/v1/manifestPath/manifest.json`

const defaultVersionManifest: VersionManifest = {
  version: 'v1',
  basePath: '/sudoku/v1/',
  difficulties: {
    easy: {
      difficulty: 'easy',
      chunks: 200,
      chunkSize: 500,
      totalPuzzles: 100000,
      chunkPadding: 4,
      basePath: '/sudoku/v1/easy/',
    },
    medium: {
      difficulty: 'medium',
      chunks: 354,
      chunkSize: 500,
      totalPuzzles: 176643,
      chunkPadding: 4,
      basePath: '/sudoku/v1/medium/',
    },
  },
}

// GET https://sjr-puzzles.pages.dev/sudoku/v1/easy/0020.json
// return:
// HttpResponse.json(generatePuzzleSources(5))

// TODO: fix the double load

// export const MultiUnitConflict: Story = {
//   beforeEach: () => {
//     mocked(getXRandomUniqueNumbers).mockReturnValue([0, 1, 2, 3, 4])
//   },
//   play: async ({ canvasElement }) => {
//     const canvas = within(canvasElement)
//     const cellIndex = 1
//     const placedValue = '8'
//     const cell = getCellButton(canvas, cellIndex)

//     await selectNumber(cell, placedValue)

//     const expectedConflictColumnCellIndex = 37
//     const expectedConflictRowCellIndex = 8
//     const expectedConflictBoxCellIndex = 9
//     const colConflict = getCellButton(canvas, expectedConflictColumnCellIndex)
//     const rowConflict = getCellButton(canvas, expectedConflictRowCellIndex)
//     const boxConflict = getCellButton(canvas, expectedConflictBoxCellIndex)
//     await expect(cell).toHaveClass(cssSelectorToRegEx('conflicted'))
//     await expect(colConflict).toHaveClass(cssSelectorToRegEx('conflicted'))
//     await expect(rowConflict).toHaveClass(cssSelectorToRegEx('conflicted'))
//     await expect(boxConflict).toHaveClass(cssSelectorToRegEx('conflicted'))
//   },
// }
