import type { Cell, State } from '../store/useGameStore'
import { addDigits } from '../utils/bitMaskHelper'

export function setMaskDigits(digits: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9], mask = 0): number {
  return addDigits(mask, digits)
}

export function cssSelectorToRegEx(cssClass: string): RegExp {
  return new RegExp(`_${cssClass}_`)
}

//======================================
//======= State Creator Helpers ========
//======================================
export function createCell(cell: Partial<Cell> = {}): Cell {
  return {
    value: null,
    candidates: 0,
    highlightedCandidates: 0,
    strikedCandidates: 0,
    given: false,
    ...cell,
  }
}

export function createStoreState(state: Partial<State> = {}): State {
  return {
    board: [createCell()],
    selectedCellIndex: null,
    ...state,
  }
}

export function storeWithCell(state: Partial<Cell> = {}): State {
  return {
    board: [createCell(state)],
    selectedCellIndex: null,
  }
}