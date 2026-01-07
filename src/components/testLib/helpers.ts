import type { Cell, State } from '../store/useGameStore'
import { addDigits } from '../utils/bitMaskHelper'

export function setMaskDigits(digits: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9], mask = 0): number {
  return addDigits(mask, digits)
}

export function createCell(cell: Partial<Cell> = {}): Cell {
  return {
    value: null,
    candidates: 0,
    highlightedCandidates: 0,
    strikedCandidates: 0,
    ...cell,
  }
}

export function createStoreState(state: Partial<State> = {}): State {
  return {
      board: [
        {
          value: null,
          candidates: 0,
          highlightedCandidates: 0,
          strikedCandidates: 0,
        },
      ],
      selectedCellIndex: null,
      ...state,
    }
}
