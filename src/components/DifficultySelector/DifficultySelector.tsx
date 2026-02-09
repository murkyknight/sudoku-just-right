import { difficultyType, type Difficulty } from '@/types'
import { useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'
import styles from './DifficultySelector.module.css'
import useDifficulty from './hooks/useDifficulty'

export default function DifficultySelector() {
  const [difficulty, setDifficulty] = useState<Difficulty>(difficultyType.EASY)
  const { puzzles, loadNextSudoku, currentSudoku, isLoading } = useDifficulty({ difficulty })
  console.log('useDifficulty - currentSudoku: ', { puzzles, currentSudoku, isLoading })

  const handleChange = (newDifficulty: string) => {
    if (!newDifficulty) {
      // if same difficulty selected, empty string is passed
      return loadNextSudoku()
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
