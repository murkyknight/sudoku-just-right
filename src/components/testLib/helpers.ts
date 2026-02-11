import type { Difficulty, RootManifest } from '@/types'
import type { SudokuPuzzleSource } from '../DifficultySelector/api'
import type { Cell, State } from '../store/useGameStore'
import { addDigits } from '../utils/bitMaskHelper'

const createInitialState = (baseBoard: number[] = getDefaultBoard()): State => ({
  board: Array.from({ length: 81 }, (_, i) => ({
    value: baseBoard[i] || null,
    candidates: 0,
    highlightedCandidates: 0,
    strikedCandidates: 0,
    given: !!baseBoard[i],
    hasConflict: false,
  })),
  selectedCellIndex: null,
})

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
    hasConflict: false,
    ...cell,
  }
}

export type CellPlacement = {
  cellIndex: number
  cellPartial: Partial<Cell>
}

export type CreateBoardProps = {
  placedCells: Array<CellPlacement>
}

export function createBoard(
  { placedCells }: CreateBoardProps = { placedCells: [] },
  rawBoard = getDefaultBoard(),
): Array<Cell> {
  const board = createInitialState(rawBoard).board

  for (const cellPlacement of placedCells) {
    const currentCell = board[cellPlacement.cellIndex]
    board[cellPlacement.cellIndex] = {
      ...currentCell,
      ...cellPlacement.cellPartial,
    }
  }

  return board
}

export function updateBoard(board: Array<Cell>, { placedCells }: CreateBoardProps): Array<Cell> {
  for (const cellPlacement of placedCells) {
    const currentCell = board[cellPlacement.cellIndex]
    board[cellPlacement.cellIndex] = {
      ...currentCell,
      ...cellPlacement.cellPartial,
    }
  }

  return board
}

// Store Creators

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

// Difficulty Helpers

export function generatePuzzleSources(
  amount: number,
  difficulty: Difficulty = 'easy',
): SudokuPuzzleSource[] {
  return Array.from({ length: amount }).map((_, _index) => {
    const id = Math.floor(Math.random() * 10000)
    return {
      id: id.toString(),
      difficulty,
      rating: '1.2',
      board: getDefaultStrBoard(),
    }
  })
}

export function createRootManifest(version: string): RootManifest {
  return {
    currentVersion: version,
    versions: {
      [version]: {
        basePath: '/basePath',
        manifestPath: `/${version}/manifestPath/manifest.json`,
      },
    },
  }
}

// ======================
// ==== MISC Helpers ====
// ======================

export function setMaskDigits(digits: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9], mask = 0): number {
  return addDigits(mask, digits)
}

export function cssSelectorToRegEx(cssClass: string): RegExp {
  return new RegExp(`_${cssClass}_`)
}

// ========================================================

// At the bottom becuase of how annoying the formmating is

// 0, 0, 0, 5, 0, 3, 6, 0, 8, // 8
// 8, 0, 9, 0, 0, 4, 0, 0, 0, // 17
// 0, 0, 0, 0, 0, 0, 0, 0, 4, // 26
// 0, 0, 6, 3, 7, 0, 2, 0, 0, // 35
// 0, 8, 0, 0, 0, 0, 0, 5, 0, // 44
// 0, 0, 7, 0, 9, 2, 4, 0, 0, // 53
// 6, 0, 0, 0, 0, 0, 0, 0, 0, // 62
// 0, 0, 0, 2, 0, 0, 1, 0, 9, // 71
// 2, 0, 3, 6, 0, 9, 0, 0, 0  // 80

export function getDefaultStrBoard(): string {
  return '0005036088090040000000000000040063702000080000050000700924060000000000000000000002001090203609000'
}

export function getDefaultBoard(): number[] {
  return [
    0,
    0,
    0,
    5,
    0,
    3,
    6,
    0,
    8, // 8
    8,
    0,
    9,
    0,
    0,
    4,
    0,
    0,
    0, // 17
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    4, // 26
    0,
    0,
    6,
    3,
    7,
    0,
    2,
    0,
    0, // 35
    0,
    8,
    0,
    0,
    0,
    0,
    0,
    5,
    0, // 44
    0,
    0,
    7,
    0,
    9,
    2,
    4,
    0,
    0, // 53
    6,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0, // 62
    0,
    0,
    0,
    2,
    0,
    0,
    1,
    0,
    9, // 71
    2,
    0,
    3,
    6,
    0,
    9,
    0,
    0,
    0, // 80
  ]
}

