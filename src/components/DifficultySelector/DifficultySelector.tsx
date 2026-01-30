import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'
import styles from './DifficultySelector.module.css'

export default function DifficultySelector() {
  return (
    <div className={styles.container}>
      <ToggleGroup defaultValue="easy" type="single" variant="outline">
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
