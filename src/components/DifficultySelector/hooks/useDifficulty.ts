import type { Difficulty, DifficultyManifestEntry } from '@/types'
import { useCallback, useEffect, useState } from 'react'
import { fetchDifficultyChunk, type SudokuPuzzleSource } from '../api'
import { getRandomInt, getXRandomUniqueNumbers, zeroPadNumber } from '../helpers'
import useManifest from './useManifest'

type UseDifficultyProps = {
  difficulty: Difficulty
}

const MAX_SUDOKU_CACHE_SIZE = 5

export default function useDifficulty({ difficulty }: UseDifficultyProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [sudokuCache, setSudokuCache] = useState<SudokuPuzzleSource[]>([])
  const [gamePointer, setGamePointer] = useState(0)
  const { isLoading: isManifestLoading, error: manifestError, manifest } = useManifest()

  const generateRandomDifficultyPaddedChunkNumber = useCallback(
    (entry: DifficultyManifestEntry) => {
      // last page might not contain the full chuck size, best to avoid it since we don't keep track of its size
      const ARRAY_OFFSET_AND_NO_LAST_PAGE = 2
      const usableChunkSize = entry.chunks - ARRAY_OFFSET_AND_NO_LAST_PAGE
      const randomChunkNumber = getRandomInt(usableChunkSize)
      const paddedChunkNumber = zeroPadNumber(randomChunkNumber, entry.chunkPadding)

      return paddedChunkNumber
    },
    [],
  )

  const loadDifficulty = useCallback(async () => {
    if (!manifest) {
      return
    }

    setIsLoading(true)
    setError(null)
    setGamePointer(0)

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
      setSudokuCache(chosenSudokus)
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
  }, [manifest, generateRandomDifficultyPaddedChunkNumber, difficulty])

  const loadNextSudoku = useCallback(() => {
    if (isLoading) {
      return
    }

    setGamePointer((prev) => {
      const hasNextPuzzle = gamePointer < sudokuCache.length - 1
      if (hasNextPuzzle) {
        return prev + 1
      }

      loadDifficulty()
      return prev
    })
  }, [isLoading, sudokuCache.length, loadDifficulty, gamePointer])

  useEffect(() => {
    if (manifest && difficulty) {
      console.log('Loading for difficulty: ', difficulty)
      loadDifficulty()
    }
  }, [manifest, loadDifficulty, difficulty])

  return {
    currentSudoku: sudokuCache[gamePointer],
    loadNextSudoku,
    puzzles: sudokuCache, // TODO: exposing just for dev testing - remove
    isLoading: isManifestLoading || isLoading,
    error: manifestError || error,
  }
}
