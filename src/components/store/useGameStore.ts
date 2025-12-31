import { create } from 'zustand'
import { combine, devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

type Cell = {
  value: number | null
  candidates: number
}

type State = {
  board: Array<Cell>
}

type Actions = {
  placeValue: (index: number, value: number) => void
  removeValue: (index: number) => void
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
              return
            }
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
      })),
    ),
  ),
)

export default useGameStore
