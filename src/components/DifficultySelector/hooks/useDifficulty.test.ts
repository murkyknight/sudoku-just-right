import type { SudokuPuzzleSource } from '@/components/DifficultySelector/api'
import * as api from '@/components/DifficultySelector/api'
import { getRandomInt, getXRandomUniqueNumbers } from '@/components/DifficultySelector/helpers'
import useManifest from '@/components/DifficultySelector/hooks/useManifest'
import type { Difficulty, VersionManifest } from '@/types'
import { act, renderHook } from '@testing-library/react'
import type { Mock } from 'vitest'
import useDifficulty from './useDifficulty'

vi.mock('@/components/DifficultySelector/hooks/useManifest', () => ({
  default: vi.fn(),
}))

vi.mock('@/components/DifficultySelector/helpers', async (importOriginal) => {
  return {
    ...(await importOriginal<typeof import('@/components/DifficultySelector/helpers.ts')>()),
    getXRandomUniqueNumbers: vi.fn(),
    getRandomInt: vi.fn(),
  }
})

const defaultVersionManifest: VersionManifest = {
  version: 'v1',
  basePath: '/sudoku/v1/',
  difficulties: {
    easy: {
      difficulty: 'easy',
      chunks: 200,
      chunkSize: 500,
      totalPuzzles: 100000,
      chunkPadding: 4,
      basePath: '/sudoku/v1/easy/',
    },
    medium: {
      difficulty: 'medium',
      chunks: 354,
      chunkSize: 500,
      totalPuzzles: 176643,
      chunkPadding: 4,
      basePath: '/sudoku/v1/medium/',
    },
  },
}

export function generatePuzzleSources(
  amount: number,
  difficulty: Difficulty = 'easy',
): SudokuPuzzleSource[] {
  return Array.from({ length: amount }).map((_, index) => {
    const id = Math.floor(Math.random() * 10000)
    return {
      id: id.toString(),
      difficulty,
      rating: '1.2',
      board: index.toString().repeat(10),
    }
  })
}

describe('useDifficulty', () => {
  let useManifestMock: Mock
  let fetchDifficultyAPISpy: Mock
  let getRandomIntMock: Mock
  let getXRandomUniqueNumbersMock: Mock

  beforeEach(() => {
    getRandomIntMock = vi.mocked(getRandomInt)
    getXRandomUniqueNumbersMock = vi.mocked(getXRandomUniqueNumbers)
    useManifestMock = vi.mocked(useManifest)
    fetchDifficultyAPISpy = vi.spyOn(api, 'fetchDifficultyChunk').mockResolvedValue([])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  afterAll(() => vi.restoreAllMocks())

  describe('loading', () => {
    it('returns isLoading true when loading manifest', () => {
      useManifestMock.mockReturnValueOnce({ isLoading: true })

      const { result } = renderHook(() => useDifficulty({ difficulty: 'easy' }))

      expect(result.current.isLoading).toBe(true)
    })

    it('does not attempt to load puzzles without present manifest', () => {
      useManifestMock.mockReturnValueOnce({ isLoading: true, manifest: null })

      renderHook(() => useDifficulty({ difficulty: 'easy' }))

      expect(fetchDifficultyAPISpy).not.toHaveBeenCalled()
    })

    it('keeps isLoading true while loading difficulty chunk after manifest', async () => {
      useManifestMock
        .mockReturnValueOnce({ isLoading: true, manifest: null })
        .mockReturnValueOnce({ isLoading: false, manifest: defaultVersionManifest })

      const { result, rerender } = renderHook(() => useDifficulty({ difficulty: 'easy' }))

      expect(result.current.isLoading).toBe(true)

      rerender()

      await vi.waitFor(() => {
        expect(fetchDifficultyAPISpy).toHaveBeenCalledTimes(1)
        expect(result.current.isLoading).toBe(true)
      })
    })

    it('starts loading difficulty chunk with a present manifest', () => {
      useManifestMock.mockReturnValue({
        isLoading: false,
        manifest: defaultVersionManifest,
      })

      renderHook(() => useDifficulty({ difficulty: 'easy' }))

      expect(fetchDifficultyAPISpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('fetching difficulty', () => {
    it('fetches one chunk within chosen difficulty with padded number', () => {
      useManifestMock.mockReturnValue({ isLoading: false, manifest: defaultVersionManifest })
      getRandomIntMock.mockReturnValue(55)

      renderHook(() => useDifficulty({ difficulty: 'easy' }))

      expect(fetchDifficultyAPISpy).toHaveBeenCalledWith('/sudoku/v1/easy/0055.json')
    })

    it('returns the first cached sudoku puzzle after fetching puzzles', async () => {
      useManifestMock.mockReturnValue({ isLoading: false, manifest: defaultVersionManifest })
      getRandomIntMock.mockReturnValue(55)
      getXRandomUniqueNumbersMock.mockReturnValue([0, 1, 2, 3, 4])
      const expectedPuzzleSources = generatePuzzleSources(5)
      fetchDifficultyAPISpy.mockResolvedValueOnce(expectedPuzzleSources)

      const { result } = renderHook(() => useDifficulty({ difficulty: 'easy' }))

      expect(fetchDifficultyAPISpy).toHaveBeenCalledWith('/sudoku/v1/easy/0055.json')
      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.currentSudoku).toEqual(expectedPuzzleSources[0])
      })
    })

    it('on new difficulty, fetches puzzles for that difficulty', async () => {
      useManifestMock.mockReturnValue({ isLoading: false, manifest: defaultVersionManifest })
      getRandomIntMock.mockReturnValue(55)
      getXRandomUniqueNumbersMock.mockReturnValue([0, 1, 2, 3, 4])
      const expectedEasyPuzzleSources = generatePuzzleSources(5, 'easy')
      const expectedMediumPuzzleSources = generatePuzzleSources(5, 'medium')
      fetchDifficultyAPISpy
        .mockResolvedValueOnce(expectedEasyPuzzleSources)
        .mockResolvedValueOnce(expectedMediumPuzzleSources)

      const { result, rerender } = renderHook(
        ({ difficulty }: { difficulty: Difficulty }) => useDifficulty({ difficulty }),
        {
          initialProps: { difficulty: 'easy' },
        },
      )

      await vi.waitFor(() => {
        expect(fetchDifficultyAPISpy).toHaveBeenCalledWith('/sudoku/v1/easy/0055.json')
        expect(result.current.isLoading).toBe(false)
        expect(result.current.currentSudoku).toEqual(expectedEasyPuzzleSources[0])
      })

      rerender({ difficulty: 'medium' })

      await vi.waitFor(() => {
        expect(fetchDifficultyAPISpy).toHaveBeenCalledWith('/sudoku/v1/medium/0055.json')
        expect(result.current.isLoading).toBe(false)
        expect(result.current.currentSudoku).toEqual(expectedMediumPuzzleSources[0])
      })
    })
  })

  describe('loadNextSudoku', () => {
    it('returns a function to move to the next fetched puzzle', async () => {
      useManifestMock.mockReturnValue({ isLoading: false, manifest: defaultVersionManifest })
      getRandomIntMock.mockReturnValue(55)
      getXRandomUniqueNumbersMock.mockReturnValue([0, 1, 2, 3, 4])
      const expectedPuzzleSources = generatePuzzleSources(5)
      fetchDifficultyAPISpy.mockResolvedValueOnce(expectedPuzzleSources)

      const { result } = renderHook(() => useDifficulty({ difficulty: 'easy' }))

      expect(fetchDifficultyAPISpy).toHaveBeenCalledWith('/sudoku/v1/easy/0055.json')
      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.loadNextSudoku).not.toBeNull()
      })
    })

    it('does not move to next puzzle if hook is currently loading', async () => {
      useManifestMock.mockReturnValue({ isLoading: false, manifest: defaultVersionManifest })
      getRandomIntMock.mockReturnValue(55)
      getXRandomUniqueNumbersMock.mockReturnValue([0, 1, 2, 3, 4])
      const expectedPuzzleSources = generatePuzzleSources(5)
      fetchDifficultyAPISpy.mockResolvedValueOnce(expectedPuzzleSources)

      const { result } = renderHook(() => useDifficulty({ difficulty: 'easy' }))

      expect(result.current.isLoading).toBe(true)
      act(() => {
        result.current.loadNextSudoku()
      })
      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.currentSudoku).toEqual(expectedPuzzleSources[0]) // still at index 0
      })
    })

    it('returns next cached puzzle when loadNextSudoku is called without refetching again', async () => {
      useManifestMock.mockReturnValue({ isLoading: false, manifest: defaultVersionManifest })
      getRandomIntMock.mockReturnValue(55)
      getXRandomUniqueNumbersMock.mockReturnValue([0, 1, 2, 3, 4])
      const expectedPuzzleSources = generatePuzzleSources(5)
      fetchDifficultyAPISpy.mockResolvedValueOnce(expectedPuzzleSources)

      const { result } = renderHook(() => useDifficulty({ difficulty: 'easy' }))

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.currentSudoku).toEqual(expectedPuzzleSources[0])
      })

      act(() => {
        result.current.loadNextSudoku()
      })

      await vi.waitFor(() => {
        expect(result.current.currentSudoku).toEqual(expectedPuzzleSources[1])
      })

      // ensure no refetch happened
      expect(fetchDifficultyAPISpy).toHaveBeenCalledTimes(1)
    })

    it('refetches puzzle cache when cache is exhausted', async () => {
      useManifestMock.mockReturnValue({ isLoading: false, manifest: defaultVersionManifest })
      getRandomIntMock.mockReturnValue(55)
      getXRandomUniqueNumbersMock.mockReturnValue([0]) // only put 1 puzzle in cache for testing purpose
      const expectedPuzzleSources = generatePuzzleSources(1)
      fetchDifficultyAPISpy.mockResolvedValueOnce(expectedPuzzleSources)

      const { result } = renderHook(() => useDifficulty({ difficulty: 'easy' }))

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.currentSudoku).toEqual(expectedPuzzleSources[0])
      })

      act(() => {
        result.current.loadNextSudoku()
      })
      expect(result.current.isLoading).toBe(true)
      expect(fetchDifficultyAPISpy).toHaveBeenCalledTimes(2)
    })
  })

  describe('error', () => {
    it('returns an error when fetching manifest errors', async () => {
      useManifestMock.mockReturnValue({
        isLoading: false,
        manifest: null,
        error: new Error('Manifest failed'),
      })

      const { result } = renderHook(() => useDifficulty({ difficulty: 'easy' }))

      await vi.waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error)
        expect(result.current.error?.message).toBe('Manifest failed')
      })
    })

    it('returns an error when fetching difficulty chunk errors', async () => {
      useManifestMock.mockReturnValue({ isLoading: false, manifest: defaultVersionManifest })
      getRandomIntMock.mockReturnValue(55)
      getXRandomUniqueNumbersMock.mockReturnValue([0, 1, 2, 3, 4])
      fetchDifficultyAPISpy.mockRejectedValueOnce(new Error('Difficulty fetch failed'))

      const { result } = renderHook(() => useDifficulty({ difficulty: 'easy' }))

      await vi.waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error)
        expect(result.current.error?.message).toBe('Difficulty fetch failed')
        expect(result.current.isLoading).toBe(false)
      })
    })
  })
})
