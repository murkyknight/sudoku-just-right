import { difficultyType, type Difficulty } from '@/types'
import { useShallow } from 'zustand/shallow'
import useGameStore from '../store/useGameStore'
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'
import styles from './DifficultySelector.module.css'
import useDifficulty from './hooks/useDifficulty'

const difficultyLabels = {
  [difficultyType.EASY]: 'Breezy',
  [difficultyType.MEDIUM]: 'Mild',
  [difficultyType.HARD]: 'Tough',
  [difficultyType.PRO]: 'Nasty',
  [difficultyType.EXPERT]: 'Brutal',
  [difficultyType.MASTER]: 'Sorry',
}

export default function DifficultySelector() {
  useDifficulty()
  const { difficulty, setDifficulty, nextSudokuPuzzle } = useGameStore(
    useShallow((s) => ({
      difficulty: s.difficulty,
      setDifficulty: s.setDifficulty,
      nextSudokuPuzzle: s.nextSudokuPuzzle,
    })),
  )

  const handleChange = (newDifficulty: string) => {
    if (!newDifficulty) {
      // if same difficulty selected, empty string is passed, thus move to next puzzle
      return nextSudokuPuzzle()
    }

    if (newDifficulty.toUpperCase() in difficultyType) {
      setDifficulty(newDifficulty as Difficulty)
    }
  }

  return (
    <div className={styles.container}>
      <ToggleGroup
        defaultValue={difficultyType.EASY}
        onValueChange={handleChange}
        size="lg"
        type="single"
        value={difficulty}
        variant="outline"
      >
        {Object.entries(difficultyLabels).map(([diffLevel, diffLabel]) => {
          return (
            <ToggleGroupItem aria-label={`Toggle ${diffLabel}`} key={diffLevel} value={diffLevel}>
              {diffLabel}
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
    </div>
  )
}
