import qqwing from 'qqwing'

/**
 * Solves a sudoku puzzle from a board string.
 *
 * @param board - 81-element array, digits 1-9 for givens, 0 for empty cells
 * @returns 81-element solution array (digits 1-9), or null if unsolvable
 */
export function solvePuzzle(board: number[]): number[] | null {
  if (board.length !== 81) {
    return null
  }

  const solver = new qqwing()

  solver.setPuzzle(board)
  const solved = solver.solve()

  if (!solved) {
    return null
  }

  const solution = parseRawSolution(solver.getSolutionString())

  if (solution.length !== 81) {
    return null
  }

  return solution
}

function parseRawSolution(rawSolution: string): number[] {
  // qqwing returns grid chars in their solution string, we need to strip these out
  return rawSolution
    .replace(/[^1-9]/g, '')
    .split('')
    .map(Number)
}