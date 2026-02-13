import { useEffect } from 'react'
import { useShallow } from 'zustand/shallow'
import Box from './Box'
import DifficultySelector from './DifficultySelector/DifficultySelector'
import styles from './GameBoard.module.css'
import useGameStore from './store/useGameStore'

export const BOXS = [0, 1, 2, 3, 4, 5, 6, 7, 8]

// const root = window.document.documentElement
// root.classList.add('dark')
export default function GameBoard() {
  const { currentPuzzle, phase, loadBoard } = useGameStore(
    useShallow((s) => ({
      currentPuzzle: s.puzzles[s.puzzleIndex],
      phase: s.gamePhase,
      loadBoard: s.loadBoard,
    })),
  )

  useEffect(() => {
    const isLoading = phase === 'loading'
    if (!isLoading && currentPuzzle) {
      loadBoard(currentPuzzle.board)
    }
  }, [loadBoard, currentPuzzle, phase])

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