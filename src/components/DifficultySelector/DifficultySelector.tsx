import { difficultyType, type Difficulty } from '@/types'
import { useShallow } from 'zustand/shallow'
import useGameStore from '../store/useGameStore'
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'
import styles from './DifficultySelector.module.css'
import useDifficulty from './hooks/useDifficulty'

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
        defaultValue="easy"
        onValueChange={handleChange}
        type="single"
        value={difficulty}
        variant="outline"
      >
        <ToggleGroupItem aria-label="Toggle Breezy" value="easy">
          Breezy
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="Toggle Mild" value="medium">
          Mild
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="Toggle Tough" value="hard">
          Tough
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="Toggle Nasty" value="pro">
          Nasty
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="Toggle Brutal" value="expert">
          Brutal
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="Toggle Sorry" value="master">
          Sorry
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
