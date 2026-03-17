import type { SolverWorkerResponse } from '@/workers/sudokuSolver.worker'
import { useCallback, useEffect, useRef } from 'react'
import type { SudokuPuzzleSource } from '../DifficultySelector/api'
import useGameStore from '../store/useGameStore'

/**
 * Headless orchestrator component.
 *
 * Watches `activeGame` and `puzzleSolution`. When a new puzzle is loaded
 * without an existing solution (e.g. fresh puzzle, or persisted state without
 * a solution), it spins up a Web Worker to solve it asynchronously and writes
 * the result back to the store via `setPuzzleSolution`.
 *
 * Stale worker responses are discarded — if the active puzzle changes before
 * the worker finishes, the result is ignored both here (via the puzzleId ref)
 * and in `setPuzzleSolution` itself as a second line of defence.
 */
export function SudokuSolverSync() {
  const activeGame = useGameStore((s) => s.activeGame)
  const puzzleSolution = useGameStore((s) => s.puzzleSolution)
  const setPuzzleSolution = useGameStore((s) => s.setPuzzleSolution)

  const workerRef = useRef<Worker | null>(null)
  const solvingPuzzleIdRef = useRef<string | null>(null)

  const solve = useCallback(
    (activeGame: SudokuPuzzleSource) => {
      // Terminate any in-flight worker from a previous puzzle
      workerRef.current?.terminate()

      const { id, board } = activeGame
      solvingPuzzleIdRef.current = id

      const worker = new Worker(new URL('@/workers/sudokuSolver.worker.ts', import.meta.url), {
        type: 'module',
      })
      workerRef.current = worker

      worker.onmessage = (e: MessageEvent<SolverWorkerResponse>) => {
        const { puzzleId, solution } = e.data
        // Guard: ignore if the active puzzle has changed since we launched this worker
        if (puzzleId !== solvingPuzzleIdRef.current) {
          return
        }

        if (solution) {
          setPuzzleSolution(puzzleId, solution)
        } else {
          console.error('[SudokuSolverSync] Solver failed:', e.data.error)
        }

        worker.terminate()
      }

      worker.onerror = (err) => {
        console.error('[SudokuSolverSync] Worker error:', err.message)
        worker.terminate()
      }

      worker.postMessage({ puzzleId: id, puzzle: [...board].map(Number) })

      return worker
    },
    [setPuzzleSolution],
  )

  useEffect(() => {
    if (!activeGame || puzzleSolution) {
      return
    }

    const worker = solve(activeGame)

    return () => {
      worker.terminate()
      solvingPuzzleIdRef.current = null
    }
  }, [activeGame?.id, puzzleSolution, activeGame, solve]) // re-run only when the puzzle ID changes, not on every store update

  return null
}
