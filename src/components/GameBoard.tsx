import Box from './Box'
import DifficultySelector from './DifficultySelector/DifficultySelector'
import styles from './GameBoard.module.css'

export const BOXS = [0, 1, 2, 3, 4, 5, 6, 7, 8]

export default function GameBoard() {
  // const root = window.document.documentElement
  // root.classList.add('dark')

  return (
    <div className={styles.container}>
      <DifficultySelector />
      <Board />
    </div>
  )
}

export function Board() {
  return (
    <div className={styles.gameBoardContainer}>
      {BOXS.map((boxIndex) => {
        return <Box index={boxIndex} key={`box-${boxIndex}`} />
      })}
    </div>
  )
}