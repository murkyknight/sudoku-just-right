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
  const { activeGame, phase, hasHydrated, ensureActiveGame, loadBoard } = useGameStore(
    useShallow((s) => ({
      activeGame: s.activeGame,
      phase: s.gamePhase,
      hasHydrated: s.hasHydrated,
      ensureActiveGame: s.ensureActiveGame,
      loadBoard: s.loadBoard,
    })),
  )

  useEffect(() => {
    if (!hasHydrated) {
      return
    }
    ensureActiveGame()
  }, [hasHydrated, ensureActiveGame])

  useEffect(() => {
    const isGamePhaseLoading = phase === 'loading'
    if (!isGamePhaseLoading && activeGame) {
      loadBoard(activeGame.board)
    }
  }, [loadBoard, activeGame, phase])

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