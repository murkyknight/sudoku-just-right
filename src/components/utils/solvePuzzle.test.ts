import { describe, expect, it } from 'vitest'
import { solvePuzzle } from './solvePuzzle'

// Real puzzle/solution pairs verified against QQWing
const EASY_PUZZLE =
  '093427500007015300024680007300760219600000000000130000405800926001206073070009800'
const EASY_SOLUTION =
  '193427568867915342524683197358764219612598734749132685435871926981256473276349851'

const EXPERT_PUZZLE =
  '300000008007830000000190003005000900063400005000500074800000649509013020602080500'
const EXPERT_SOLUTION =
  '396745218157832496284196753415378962763429185928561374831257649549613827672984531'

const toBoard = (s: string) => s.split('').map(Number)

describe('output shape', () => {
  it('returns an array of exactly 81 numbers', () => {
    const solution = solvePuzzle(toBoard(EASY_PUZZLE))
    expect(solution).toHaveLength(81)
  })

  it('contains only digits 1–9 (no zeros)', () => {
    const solution = solvePuzzle(toBoard(EASY_PUZZLE))!
    expect(solution.every((n) => n >= 1 && n <= 9)).toBe(true)
  })
})

describe('correctness', () => {
  it('solves an easy puzzle to the known solution', () => {
    expect(solvePuzzle(toBoard(EASY_PUZZLE))).toEqual(toBoard(EASY_SOLUTION))
  })

  it('solves an expert puzzle to the known solution', () => {
    expect(solvePuzzle(toBoard(EXPERT_PUZZLE))).toEqual(
      toBoard(EXPERT_SOLUTION),
    )
  })
})

describe('invalid inputs', () => {
  it('returns null for a board shorter than 81 elements', () => {
    expect(solvePuzzle([0, 0, 3])).toBeNull()
  })

  it('returns null for a board longer than 81 elements', () => {
    expect(solvePuzzle(toBoard(`${EASY_PUZZLE}0`))).toBeNull()
  })

  it('returns null for an empty array', () => {
    expect(solvePuzzle([])).toBeNull()
  })

  it('returns null for a fully filled board (nothing to solve)', () => {
    expect(solvePuzzle(toBoard(EASY_SOLUTION))).toBeNull()
  })
})
