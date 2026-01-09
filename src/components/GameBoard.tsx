import Box from './Box'
import styles from './GameBoard.module.css'

export const BOXS = [0, 1, 2, 3, 4, 5, 6, 7, 8]

export default function GameBoard() {
  return (
    <div className={styles.container}>
      <div className={styles.gameBoardContainer}>
        {BOXS.map((boxIndex) => {
          return <Box index={boxIndex} key={`box-${boxIndex}`} />
        })}
      </div>
    </div>
  )
}
