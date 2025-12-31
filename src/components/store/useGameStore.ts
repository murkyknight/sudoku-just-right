import { create } from 'zustand'
import { combine, devtools } from 'zustand/middleware'

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

const defaultSudokuNumbers = [
  0, 0, 0, 5, 0, 3, 6, 0, 8, 8, 0, 9, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 6, 3, 7, 0,
  2, 0, 0, 0, 8, 0, 0, 0, 0, 0, 5, 0, 0, 0, 7, 0, 9, 2, 4, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  2, 0, 0, 1, 0, 9, 2, 0, 3, 6, 0, 9, 0, 0, 0,
]

const initalState = {
  board: Array.from({ length: 81 }, (_, i) => ({
    value: defaultSudokuNumbers[i] || null,
    candidates: 0,
  })),
}

const useGameStore = create<State & Actions>()(
  devtools(
    combine(initalState, (set, get) => ({
      placeValue: (index, value) => {
        const board = structuredClone(get().board)
        board[index].value = value

        set({ board })
      },
      removeValue: (index) => {
        const board = structuredClone(get().board)
        if (!board[index].value) {
          return
        }
        board[index].value = null

        set({ board })
      },
    })),
  ),
)

export default useGameStore
