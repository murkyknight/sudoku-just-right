import { create } from 'zustand'
import { combine, devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { addDigit, hasDigit, removeDigit } from '../utils/bitMaskHelper'

type Cell = {
  value: number | null
  candidates: number
  highlightedCandidates: number
}

type State = {
  board: Array<Cell>
}

type Actions = {
  placeValue: (index: number, value: number) => void
  removeValue: (index: number) => void
  addCandidate: (index: number, value: number) => void
  removeCandidate: (index: number, value: number) => void
  highlightCandidate: (index: number, value: number) => void
  removeCandidateHighlight: (index: number, value: number) => void
}

type StoreState = State & Actions

const defaultSudokuNumbers = [
  0, 0, 0, 5, 0, 3, 6, 0, 8, 8, 0, 9, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 6, 3, 7, 0,
  2, 0, 0, 0, 8, 0, 0, 0, 0, 0, 5, 0, 0, 0, 7, 0, 9, 2, 4, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  2, 0, 0, 1, 0, 9, 2, 0, 3, 6, 0, 9, 0, 0, 0,
]

const initialState = {
  board: Array.from({ length: 81 }, (_, i) => ({
    value: defaultSudokuNumbers[i] || null,
    candidates: 0,
    highlightedCandidates: 0,
  })),
}

const useGameStore = create<StoreState>()(
  devtools(
    immer(
      combine(initialState, (set, _get) => ({
        placeValue: (index, value) =>
          set((state) => {
            const cell = state.board[index]
            if (cell.value === value) {
              return // returning early tells immer and zustard there is nothing to do - no-op
            }
            // with immer, we can just update what we wanted changed and immer takes care of the rest
            // See: "Store implementation with Immer" in our notes.
            cell.value = value
          }),

        removeValue: (index) =>
          set((state) => {
            const cell = state.board[index]
            if (cell.value === null) {
              return
            }
            cell.value = null
          }),

        addCandidate: (index, candidate) =>
          set((state) => {
            const cell = state.board[index]
            cell.candidates = addDigit(cell.candidates, candidate)
          }),

        removeCandidate: (index, candidate) =>
          set((state) => {
            const cell = state.board[index]
            cell.candidates = removeDigit(cell.candidates, candidate)
            cell.highlightedCandidates = removeDigit(cell.highlightedCandidates, candidate)
            // todo: also remove striked candidate
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
      })),
    ),
  ),
)

export default useGameStore
