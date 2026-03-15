import { solvePuzzle } from '@/components/utils/solvePuzzle'

export type SolverWorkerMessage = {
  puzzleId: string
  puzzle: number[]
}

export type SolverWorkerResponse =
  | { puzzleId: string; solution: number[] }
  | { puzzleId: string; solution: null; error: string }

self.onmessage = (e: MessageEvent<SolverWorkerMessage>) => {
  const { puzzleId, puzzle } = e.data

  try {
    const solution = solvePuzzle(puzzle)

    if (solution) {
      const response: SolverWorkerResponse = {
        puzzleId,
        solution,
      }

      self.postMessage(response)
    } else {
      const response: SolverWorkerResponse = {
        puzzleId,
        solution: null,
        error: 'QQWing could not find a solution',
      }

      self.postMessage(response)
    }
  } catch (err) {
    const response: SolverWorkerResponse = {
      puzzleId,
      solution: null,
      error: err instanceof Error ? err.message : 'Unknown solver error',
    }

    self.postMessage(response)
  }
}
