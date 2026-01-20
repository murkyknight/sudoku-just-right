import { create } from 'zustand'
import { combine, devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { addDigit, hasDigit, removeDigit } from '../utils/bitMaskHelper'
import * as draftHeleprs from './helpers/draftHelpers'

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
}

type Actions = {
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
  0, 0, 0, 5, 0, 3, 6, 0, 8, 8, 0, 9, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 6, 3, 7, 0,
  2, 0, 0, 0, 8, 0, 0, 0, 0, 0, 5, 0, 0, 0, 7, 0, 9, 2, 4, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  2, 0, 0, 1, 0, 9, 2, 0, 3, 6, 0, 9, 0, 0, 0,
]

const initialState: State = {
  board: Array.from({ length: 81 }, (_, i) => ({
    value: defaultSudokuNumbers[i] || null,
    candidates: 0,
    highlightedCandidates: 0,
    strikedCandidates: 0,
    given: !!defaultSudokuNumbers[i],
    hasConflict: false,
  })),
  selectedCellIndex: null,
}

export const createUseStore = () =>
  create<StoreState>()(
    devtools(
      immer(
        combine(initialState, (set, _get) => ({
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
              draftHeleprs.updateConflictsInDraft(state, index, value)

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
              draftHeleprs.clearResolvedPeerConflictsForCellInDraft(state, index)
              // cell.hasConflict = false // I don't think we need this since the helper sets this
              // - although now we depend on the helper - which means we need to have this scenario under store test
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
