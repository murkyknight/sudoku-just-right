import { useEffect } from 'react'
import { useShallow } from 'zustand/shallow'
import Box from '../Box'
import DifficultySelector from '../DifficultySelector/DifficultySelector'
import useGameStore from '../store/useGameStore'
import styles from './GameBoard.module.css'

export const BOXS = [0, 1, 2, 3, 4, 5, 6, 7, 8]

// const root = window.document.documentElement
// root.classList.add('dark')
export default function GameBoard() {
  const { hasHydrated, ensureActiveGame } = useGameStore(
    useShallow((s) => ({
      hasHydrated: s.hasHydrated,
      ensureActiveGame: s.ensureActiveGame,
    })),
  )

  useEffect(() => {
    if (!hasHydrated) {
      return
    }

    ensureActiveGame()
  }, [hasHydrated, ensureActiveGame])

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