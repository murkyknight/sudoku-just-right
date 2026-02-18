import { difficultyType, type Difficulty, type GamePhase } from '@/types'
import { create } from 'zustand'
import { combine, devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { SudokuPuzzleSource } from '../DifficultySelector/api'
import { addDigit, hasDigit, removeDigit } from '../utils/bitMaskHelper'
import {
  addPuzzlesToCacheInDraft,
  clearResolvedPeerConflictsForCellInDraft,
  createBoardInDraft,
  startNextPuzzleInDraft,
  updateConflictsForCellInDraft,
} from './helpers/draftHelpers'

// We could also add helper functions like:
//  hasCandidate(value:number)
//  isHighlighted, isStriked
export type Cell = {
  value: number | null
  candidates: number
  highlightedCandidates: number
  strikedCandidates: number
  given: boolean
  hasConflict: boolean
}

export type State = {
  board: Array<Cell>
  selectedCellIndex: number | null

  activeGame: SudokuPuzzleSource | null
  difficulty: Difficulty
  gamePhase: GamePhase
  puzzles: Array<SudokuPuzzleSource>

  hasHydrated: boolean
}

type Actions = {
  loadBoard: (rawBoard: string) => void
  setDifficulty: (difficulty: Difficulty) => void
  setPuzzles: (puzzles: Array<SudokuPuzzleSource>) => void
  nextSudokuPuzzle: () => void
  ensureActiveGame: () => void

  selectCell: (index: number | null) => void
  removeSelectedCell: () => void

  placeValue: (index: number, value: number) => void
  removeValue: (index: number) => void

  addCandidate: (index: number, value: number) => void
  removeCandidate: (index: number, value: number) => void
  highlightCandidate: (index: number, value: number) => void
  removeCandidateHighlight: (index: number, value: number) => void
  strikeCandidate: (index: number, value: number) => void
  removeCandidateStrike: (index: number, value: number) => void // currently unused, maybe change to toggle?
}

export type StoreState = State & Actions

const defaultSudokuNumbers = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
]

const initialState: State = {
  // TODO: probably should be null now
  board: Array.from({ length: 81 }, (_, i) => ({
    value: defaultSudokuNumbers[i] || null,
    candidates: 0,
    highlightedCandidates: 0,
    strikedCandidates: 0,
    given: !!defaultSudokuNumbers[i],
    hasConflict: false,
  })),
  selectedCellIndex: null,

  activeGame: null,
  difficulty: difficultyType.EASY,
  gamePhase: 'idle',
  puzzles: [],

  hasHydrated: true, // TODO: true for now but change to false when we add `persist` middleware
}

export const createUseStore = () =>
  create<StoreState>()(
    devtools(
      immer(
        combine(initialState, (set, _get) => ({
          loadBoard: (rawBoard) =>
            set((draft) => {
              createBoardInDraft(draft, rawBoard)
            }),

          setDifficulty: (difficulty: Difficulty) =>
            set((draft) => {
              if (difficulty === draft.difficulty) {
                return
              }

              draft.difficulty = difficulty
              draft.activeGame = null
              draft.puzzles = []
              draft.gamePhase = 'loading'
            }),

          setPuzzles: (newPuzzles: Array<SudokuPuzzleSource>) =>
            set((draft) => {
              addPuzzlesToCacheInDraft(draft, newPuzzles)

              if (!draft.activeGame) {
                startNextPuzzleInDraft(draft)
              }
            }),

          nextSudokuPuzzle: () =>
            set((draft) => {
              startNextPuzzleInDraft(draft)
            }),

          ensureActiveGame: () =>
            set((draft) => {
              if (draft.activeGame) {
                return
              }

              draft.gamePhase = 'loading'
            }),

          selectCell: (index) =>
            set((state) => {
              state.selectedCellIndex = index
            }),

          removeSelectedCell: () =>
            set((state) => {
              state.selectedCellIndex = null
            }),

          placeValue: (index, value) =>
            set((state) => {
              const cell = state.board[index]
              if (cell.value === value) {
                return // returning early tells immer and zustard there is nothing to do - no-op
              }

              cell.value = value
              updateConflictsForCellInDraft(state, index)

              // with immer, we can just update what we wanted changed and immer takes care of the rest
              // See: "Store implementation with Immer" in our notes.
            }),

          removeValue: (index) =>
            set((state) => {
              const cell = state.board[index]
              if (cell.value === null) {
                return
              }

              cell.value = null
              clearResolvedPeerConflictsForCellInDraft(state, index)
            }),

          addCandidate: (index, candidate) =>
            set((state) => {
              const cell = state.board[index]
              cell.candidates = addDigit(cell.candidates, candidate)
            }),

          removeCandidate: (index, candidate) =>
            set((state) => {
              const cell = state.board[index]
              cell.strikedCandidates = removeDigit(cell.strikedCandidates, candidate)
              cell.highlightedCandidates = removeDigit(cell.highlightedCandidates, candidate)
              cell.candidates = removeDigit(cell.candidates, candidate)
            }),

          highlightCandidate: (index, candidate) =>
            set((state) => {
              const cell = state.board[index]
              if (!hasDigit(cell.candidates, candidate)) {
                cell.candidates = addDigit(cell.candidates, candidate)
              }
              cell.highlightedCandidates = addDigit(cell.highlightedCandidates, candidate)
            }),

          removeCandidateHighlight: (index, candidate) =>
            set((state) => {
              const cell = state.board[index]
              cell.highlightedCandidates = removeDigit(cell.highlightedCandidates, candidate)
            }),

          strikeCandidate: (index, candidate) =>
            set((state) => {
              const cell = state.board[index]
              if (!hasDigit(cell.candidates, candidate)) {
                return
              }
              cell.highlightedCandidates = removeDigit(cell.highlightedCandidates, candidate)
              cell.strikedCandidates = addDigit(cell.strikedCandidates, candidate)
            }),

          removeCandidateStrike: (index, candidate) =>
            set((state) => {
              const cell = state.board[index]
              cell.highlightedCandidates = removeDigit(cell.highlightedCandidates, candidate)
            }),
        })),
      ),
    ),
  )

// Default singleton for app usage (to not be used in tests)
const useGameStore = createUseStore()
export default useGameStore
