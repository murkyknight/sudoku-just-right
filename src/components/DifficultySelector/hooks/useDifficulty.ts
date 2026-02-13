import useGameStore from '@/components/store/useGameStore'
import type { DifficultyManifestEntry } from '@/types'
import { useCallback, useEffect, useState } from 'react'
import { useShallow } from 'zustand/shallow'
import { fetchDifficultyChunk } from '../api'
import { getRandomInt, getXRandomUniqueNumbers, zeroPadNumber } from '../helpers'
import useManifest from './useManifest'

const MAX_SUDOKU_CACHE_SIZE = 5

  const generateRandomDifficultyPaddedChunkNumber = (entry: DifficultyManifestEntry) => {
    // last page might not contain the full chuck size, best to avoid it since we don't keep track of its size
    const ARRAY_OFFSET_AND_NO_LAST_PAGE = 2
    const usableChunkSize = entry.chunks - ARRAY_OFFSET_AND_NO_LAST_PAGE
    const randomChunkNumber = getRandomInt(usableChunkSize)
    const paddedChunkNumber = zeroPadNumber(randomChunkNumber, entry.chunkPadding)

    return paddedChunkNumber
  }

export default function useDifficulty() {
  const { difficulty, puzzleIndex, puzzles, phase, setPuzzles } = useGameStore(
    useShallow((s) => ({
      difficulty: s.difficulty,
      puzzleIndex: s.puzzleIndex,
      puzzles: s.puzzles,
      phase: s.gamePhase,
      setPuzzles: s.setPuzzles,
    })),
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { isLoading: isManifestLoading, error: manifestError, manifest } = useManifest()

  const loadDifficulty = useCallback(async () => {
    if (!manifest) {
      return
    }

    setIsLoading(true)
    setError(null)

    const difficultyManifestEntry = manifest.difficulties[difficulty]
    const paddedChunkNumber = generateRandomDifficultyPaddedChunkNumber(difficultyManifestEntry)

    try {
      const sudokuPuzzleChunk = await fetchDifficultyChunk(
        `${difficultyManifestEntry.basePath}${paddedChunkNumber}.json`,
      )
      console.log(`fetched file: ${paddedChunkNumber}.json`, sudokuPuzzleChunk)

      const randomSudokuPuzzleIndexes = getXRandomUniqueNumbers(
        difficultyManifestEntry.chunkSize,
        MAX_SUDOKU_CACHE_SIZE,
      )
      console.log('Selecting puzzles: ', randomSudokuPuzzleIndexes)
      const chosenSudokus = randomSudokuPuzzleIndexes.map(
        (puzzleIndex: number) => sudokuPuzzleChunk[puzzleIndex],
      )
      console.log('About to save these chosen puzzles to GAME CACHE: ', chosenSudokus)
      setPuzzles(chosenSudokus)
    } catch (err) {
      if (err instanceof Error) {
        console.error(err)
        setError(err)
      } else {
        // don't know what this is, throw to ErrorBoundary
        throw err
      }
    } finally {
      setIsLoading(false)
    }
  }, [manifest, difficulty, setPuzzles])

  // refill cache
  useEffect(() => {
    const isPlaying = phase === 'playing'
    const isLastPuzzle = puzzles.length > 0 && puzzleIndex === puzzles.length - 1

    if (isPlaying && isLastPuzzle && !isLoading) {
      loadDifficulty()
    }
  }, [phase, puzzles.length, loadDifficulty, puzzleIndex, isLoading])

  // inital load
  useEffect(() => {
    if (phase === 'loading' && manifest) {
      loadDifficulty()
    }
  }, [manifest, loadDifficulty, phase])

  return {
    isLoading: isManifestLoading || isLoading,
    error: manifestError || error,
  }
}
