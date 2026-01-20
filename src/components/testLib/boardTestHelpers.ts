import type { Draft } from 'immer'
import type { Cell, State } from '../store/useGameStore'

// Test Validator Helpers

type IndexedCell = {
  index: number
} & Cell

export function getConflictingCells(
  board: Array<Cell>,
  skipCellIndexes: number[] = [],
): Array<IndexedCell> {
  const conflictingCells: Array<IndexedCell> = []

  board.forEach((cell, index) => {
    const shouldNotSkipCell = !skipCellIndexes.some((i) => index === i)

    if (shouldNotSkipCell && cell.hasConflict) {
      const indexedCell: IndexedCell = {
        ...cell,
        index,
      }
      conflictingCells.push(indexedCell)
    }
  })

  return conflictingCells
}

export function getConflictingCellIndexes(
  board: Array<Cell>,
  skipCellIndexes: number[] = [],
): number[] {
  return getConflictingCells(board, skipCellIndexes).map((cell) => cell.index)
}

// Helpful console logs

export const quickLogBoard = (draft: Draft<State>) => {
  const conflictBoard = draft.board.map((cell, i) => ({
    index: i,
    value: cell.value,
    hasConflict: cell.hasConflict,
  }))
  console.log('board: ', conflictBoard)
}
