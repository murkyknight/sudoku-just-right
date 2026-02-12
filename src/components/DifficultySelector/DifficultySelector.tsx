import { difficultyType, type Difficulty } from '@/types'
import { useEffect } from 'react'
import { useShallow } from 'zustand/shallow'
import useGameStore from '../store/useGameStore'
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'
import styles from './DifficultySelector.module.css'
import useDifficulty from './hooks/useDifficulty'

export default function DifficultySelector() {
  const difficulty = useGameStore((s) => s.difficulty)
  const { loadNextSudoku, currentSudoku, isLoading } = useDifficulty({ difficulty })
  const { loadBoard, setDifficulty } = useGameStore(
    useShallow((s) => ({
      loadBoard: s.loadBoard,
      setDifficulty: s.setDifficulty,
    })),
  )

  const handleChange = (newDifficulty: string) => {
    if (!newDifficulty) {
      // if same difficulty selected, empty string is passed
      return loadNextSudoku()
    }

    if (newDifficulty.toUpperCase() in difficultyType) {
      setDifficulty(newDifficulty as Difficulty)
    }
  }

  useEffect(() => {
    if (!isLoading && currentSudoku) {
      loadBoard(currentSudoku.board)
    }
  }, [loadBoard, currentSudoku, isLoading])

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
