import type { SudokuPuzzleSource } from "@/components/DifficultySelector/api"
import { toNumberArray } from "../helpers"

const PUZZLE_A: SudokuPuzzleSource = {
  id: 'puzzle-a',
  difficulty: 'easy',
  rating: '1.0',
  board: '093427500007015300024680007300760219600000000000130000405800926001206073070009800',
}

const SOLUTION_A = toNumberArray(
  '193427568867915342524683197358764219612598734749132685435871926981256473276349851',
)

const PUZZLE_B: SudokuPuzzleSource = {
  id: 'puzzle-b',
  difficulty: 'easy',
  rating: '1.0',
  board: '300000008007830000000190003005000900063400005000500074800000649509013020602080500',
}

const SOLUTION_B = toNumberArray(
  '396745218157832496284196753415378962763429185928561374831257649549613827672984531'
)

export const puzzleEasyA = () => ({ PUZZLE_A, SOLUTION_A })
export const puzzleEasyB = () => ({ PUZZLE_B, SOLUTION_B })