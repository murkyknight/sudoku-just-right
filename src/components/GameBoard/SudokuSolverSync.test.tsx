import useGameStore from '@/components/store/useGameStore'
import { resetGameStore, toNumberArray } from '@/components/testLib/helpers'
import type { SolverWorkerResponse } from '@/workers/sudokuSolver.worker'
import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { puzzleEasyA, puzzleEasyB } from '../testLib/fixtures/puzzles'
import { SudokuSolverSync } from './SudokuSolverSync'

// ─── Worker mock ─────────────────────────────────────────────────────────────

// Capture the worker instance created during each test so we can
// simulate responses by calling onmessage manually.
let workerInstance: MockWorker

vi.mock('@/workers/sudokuSolver.worker.ts', () => ({})) // module must exist for the URL constructor

// A class mock is required — vi.fn() alone is not recognised as a constructor
// by the `new Worker(...)` call in the component.
class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null
  onerror: ((e: ErrorEvent) => void) | null = null
  postMessage = vi.fn()
  terminate = vi.fn()

  constructor() {
    workerInstance = this
  }
}

vi.stubGlobal('Worker', MockWorker)

// Simulates the worker resolving with a solution
function resolveWorker(response: SolverWorkerResponse) {
  workerInstance.onmessage!(new MessageEvent('message', { data: response }))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

const { PUZZLE_A, SOLUTION_A } = puzzleEasyA()
const { PUZZLE_B } = puzzleEasyB()

const store = () => useGameStore.getState()

beforeEach(() => {
  workerInstance = undefined!
  resetGameStore({ puzzleSolution: null })
})

afterEach(() => {
  vi.clearAllMocks()
})

afterAll(() => vi.restoreAllMocks())

describe('SudokuSolverSync', () => {
  it('posts the puzzle to the worker when an active game is set', () => {
    store().activeGame = PUZZLE_A

    render(<SudokuSolverSync />)

    expect(workerInstance.postMessage).toHaveBeenCalledWith({
      puzzle: toNumberArray(PUZZLE_A.board),
      puzzleId: PUZZLE_A.id,
    })
  })

  it('writes the solution to the store when the worker responds', async () => {
    store().activeGame = PUZZLE_A

    render(<SudokuSolverSync />)
    resolveWorker({ puzzleId: PUZZLE_A.id, solution: SOLUTION_A })

    await waitFor(() => {
      expect(store().puzzleSolution).toEqual(SOLUTION_A)
    })
  })

  it('does not launch a worker if a solution already exists', () => {
    store().activeGame = PUZZLE_A
    store().puzzleSolution = SOLUTION_A

    render(<SudokuSolverSync />)

    expect(workerInstance).toBeUndefined()
  })

  it('does not launch a worker if there is no active game', () => {
    render(<SudokuSolverSync />)

    expect(workerInstance).toBeUndefined()
  })

  it('discards a stale worker response if the puzzle has changed', async () => {
    store().activeGame = PUZZLE_A
    store().setPuzzles([PUZZLE_B])

    const { rerender } = render(<SudokuSolverSync />)

    // Puzzle changes before worker responds
    store().nextSudokuPuzzle()
    rerender(<SudokuSolverSync />)

    // Stale response for puzzle A arrives
    resolveWorker({ puzzleId: PUZZLE_A.id, solution: SOLUTION_A })

    await waitFor(() => {
      expect(store().puzzleSolution).toBeNull()
    })
  })

  it('terminates the previous worker when the puzzle changes', () => {
    store().activeGame = PUZZLE_A

    const { rerender } = render(<SudokuSolverSync />)
    const firstWorker = workerInstance

    store().activeGame = PUZZLE_B
    store().puzzleSolution = null
    rerender(<SudokuSolverSync />)

    expect(firstWorker.terminate).toHaveBeenCalled()
  })

  it('terminates the worker on unmount', () => {
    store().activeGame = PUZZLE_A

    const { unmount } = render(<SudokuSolverSync />)
    const activeWorker = workerInstance

    unmount()

    expect(activeWorker.terminate).toHaveBeenCalled()
  })

  it('does not update the store when the worker reports an error', async () => {
    store().activeGame = PUZZLE_A

    render(<SudokuSolverSync />)
    resolveWorker({ puzzleId: PUZZLE_A.id, solution: null, error: 'Solver failed' })

    await waitFor(() => {
      expect(store().puzzleSolution).toBeNull()
    })
  })
})
