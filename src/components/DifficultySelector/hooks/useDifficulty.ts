import type { Difficulty } from '@/types'
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

  const loadDifficulty = useCallback(async () => {
    if (!manifest) {
      return
    }

    setIsLoading(true)
    setError(null)
    setGamePointer(0)

    // create the url
    const difficultyManifest = manifest.difficulties[difficulty]
    const NO_LAST_PAGE_AND_ARRAY_OFFSET = 2
    const usableChunkSize = difficultyManifest.chunks - NO_LAST_PAGE_AND_ARRAY_OFFSET
    const randomChunkNumber = getRandomInt(usableChunkSize)
    const paddedChunkNumber = zeroPadNumber(randomChunkNumber, difficultyManifest.chunkPadding)

    try {
      const puzzleChunk = await fetchDifficultyChunk(
        `${difficultyManifest.basePath}${paddedChunkNumber}.json`,
      )
      console.log(`fetched file: ${paddedChunkNumber}.json`, puzzleChunk)

      // select 5 random SudokuPuzzleSource

      const randomPuzzleIndexes = getXRandomUniqueNumbers(
        difficultyManifest.chunkSize,
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
  }, [difficulty, manifest])

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
