import type { Difficulty, DifficultyManifestEntry } from '@/types'
import { useCallback, useEffect, useState } from 'react'
import { fetchDifficultyChunk, type SudokuPuzzleSource } from '../api'
import { getRandomInt, getXRandomUniqueNumbers, zeroPadNumber } from '../helpers'
import useManifest from './useManifest'

type UseDifficultyProps = {
  difficulty: Difficulty
}

const MAX_CACHED_PUZZLES = 5

export default function useDifficulty({ difficulty }: UseDifficultyProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [gameCache, setGameCache] = useState<SudokuPuzzleSource[]>([])
  const [gamePointer, setGamePointer] = useState(0)
  const { isLoading: isManifestLoading, error: manifestError, manifest } = useManifest()

  const generateRandomDifficultyPaddedChunkNumber = useCallback(
    (entry: DifficultyManifestEntry) => {
      // last page might not contain the full chuck size, best to avoid it
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
      const puzzleChunk = await fetchDifficultyChunk(
        `${difficultyManifestEntry.basePath}${paddedChunkNumber}.json`,
      )
      console.log(`fetched file: ${paddedChunkNumber}.json`, puzzleChunk)

      // select 5 random SudokuPuzzleSource

      const randomPuzzleIndexes = getXRandomUniqueNumbers(
        difficultyManifestEntry.chunkSize,
        MAX_CACHED_PUZZLES,
      )
      console.log('Selecting puzzles: ', randomPuzzleIndexes)
      const chosenPuzzles = randomPuzzleIndexes.map(
        (puzzleIndex: number) => puzzleChunk[puzzleIndex],
      )
      console.log('About to save these chosen puzzles to GAME CACHE: ', chosenPuzzles)
      setGameCache(chosenPuzzles)
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
      const hasNextPuzzle = gamePointer < gameCache.length - 1
      if (hasNextPuzzle) {
        return prev + 1
      }

      loadDifficulty()
      return prev
    })
  }, [isLoading, gameCache.length, loadDifficulty, gamePointer])

  useEffect(() => {
    if (manifest && difficulty) {
      console.log('Loading for difficulty: ', difficulty)
      loadDifficulty()
    }
  }, [manifest, loadDifficulty, difficulty])

  return {
    currentSudoku: gameCache[gamePointer],
    loadNextSudoku,
    puzzles: gameCache, // TODO: exposing just for dev testing - remove
    isLoading: isManifestLoading || isLoading,
    error: manifestError || error,
  }
}
