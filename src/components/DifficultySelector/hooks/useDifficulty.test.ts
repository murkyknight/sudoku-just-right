import * as api from '@/components/DifficultySelector/api'
import { getRandomInt, getXRandomUniqueNumbers } from '@/components/DifficultySelector/helpers'
import useManifest from '@/components/DifficultySelector/hooks/useManifest'
import useGameStore, { type StoreState } from '@/components/store/useGameStore'
import { generatePuzzleSources, resetGameStore } from '@/components/testLib/helpers'
import type { VersionManifest } from '@/types'
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

describe('useDifficulty', () => {
  let store: () => StoreState
  
  let useManifestMock: Mock
  let fetchDifficultyAPISpy: Mock
  let getRandomIntMock: Mock
  let getXRandomUniqueNumbersMock: Mock

  beforeEach(() => {
    resetGameStore({ gamePhase: 'loading' })
    store = () => useGameStore.getState()

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

      const { result } = renderHook(() => useDifficulty())

      expect(result.current.isLoading).toBe(true)
    })

    it('does not attempt to load puzzles without present manifest', () => {
      useManifestMock.mockReturnValueOnce({ isLoading: true, manifest: null })

      renderHook(() => useDifficulty())

      expect(fetchDifficultyAPISpy).not.toHaveBeenCalled()
    })

    it('does not attempt to load puzzles when phase is "playing" even with loaded manifest', () => {
      useManifestMock.mockReturnValue({ isLoading: false, manifest: defaultVersionManifest })
      store().gamePhase = 'playing'

      renderHook(() => useDifficulty())

      expect(fetchDifficultyAPISpy).not.toHaveBeenCalled()
    })

    it('keeps isLoading true while loading difficulty chunk after manifest', async () => {
      useManifestMock
        .mockReturnValueOnce({ isLoading: true, manifest: null })
        .mockReturnValueOnce({ isLoading: false, manifest: defaultVersionManifest })

      const { result, rerender } = renderHook(() => useDifficulty())

      expect(result.current.isLoading).toBe(true)

      rerender()

      await vi.waitFor(() => {
        expect(fetchDifficultyAPISpy).toHaveBeenCalledTimes(1)
        expect(result.current.isLoading).toBe(true)
      })
    })

    it('starts loading difficulty chunk with a present manifest and phase is "loading"', () => {
      store().gamePhase = 'loading'
      useManifestMock.mockReturnValue({
        isLoading: false,
        manifest: defaultVersionManifest,
      })

      renderHook(() => useDifficulty())

      expect(fetchDifficultyAPISpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('fetching difficulty', () => {
    it('fetches one chunk within chosen difficulty with padded number', () => {
      useManifestMock.mockReturnValue({ isLoading: false, manifest: defaultVersionManifest })
      getRandomIntMock.mockReturnValue(55)

      renderHook(() => useDifficulty())

      expect(fetchDifficultyAPISpy).toHaveBeenCalledWith('/sudoku/v1/easy/0055.json')
    })

    it('saves fetched puzzles to store cache', async () => {
      useManifestMock.mockReturnValue({ isLoading: false, manifest: defaultVersionManifest })
      getRandomIntMock.mockReturnValue(55)
      getXRandomUniqueNumbersMock.mockReturnValue([0, 1, 2, 3, 4])
      const expectedEasyPuzzleSources = generatePuzzleSources(5, 'easy')
      fetchDifficultyAPISpy.mockResolvedValueOnce(expectedEasyPuzzleSources)

      renderHook(() => useDifficulty())

      await vi.waitFor(() => {
        expect(fetchDifficultyAPISpy).toHaveBeenCalledWith('/sudoku/v1/easy/0055.json')
      })
      expect(store().puzzles).toEqual(expectedEasyPuzzleSources)
    })

    it('on new difficulty, fetches puzzles for that difficulty and stores in cache', async () => {
      useManifestMock.mockReturnValue({ isLoading: false, manifest: defaultVersionManifest })
      getRandomIntMock.mockReturnValue(55)
      getXRandomUniqueNumbersMock.mockReturnValue([0, 1, 2, 3, 4])
      const expectedEasyPuzzleSources = generatePuzzleSources(5, 'easy')
      const expectedMediumPuzzleSources = generatePuzzleSources(5, 'medium')
      fetchDifficultyAPISpy
        .mockResolvedValueOnce(expectedEasyPuzzleSources)
        .mockResolvedValueOnce(expectedMediumPuzzleSources)

      const { rerender } = renderHook(() => useDifficulty())

      await vi.waitFor(() => {
        expect(fetchDifficultyAPISpy).toHaveBeenCalledWith('/sudoku/v1/easy/0055.json')
      })

      useGameStore.getState().setDifficulty('medium')
      rerender()

      await vi.waitFor(() => {
        expect(fetchDifficultyAPISpy).toHaveBeenCalledWith('/sudoku/v1/medium/0055.json')
      })
      expect(store().puzzles).toEqual(expectedMediumPuzzleSources)
    })

    it('refetches puzzles for cache exhustion refill', async () => {
      useManifestMock.mockReturnValue({ isLoading: false, manifest: defaultVersionManifest })
      getRandomIntMock.mockReturnValue(55)
      getXRandomUniqueNumbersMock.mockReturnValue([0, 1]) // small cache
      const expectedEasyPuzzleSources = generatePuzzleSources(2, 'easy')
      const expectedNextEasyPuzzleSources = generatePuzzleSources(2, 'easy')
      fetchDifficultyAPISpy
        .mockResolvedValueOnce(expectedEasyPuzzleSources)
        .mockResolvedValueOnce(expectedNextEasyPuzzleSources)

      const { result } = renderHook(() => useDifficulty())

      await vi.waitFor(() => {
        expect(fetchDifficultyAPISpy).toHaveBeenCalledWith('/sudoku/v1/easy/0055.json')
        expect(result.current.isLoading).toBe(false)
      })

      store().nextSudokuPuzzle() // moves to last puzzle in cache - triggers refetch in hook

      await vi.waitFor(() => {
        expect(fetchDifficultyAPISpy).toHaveBeenCalledWith('/sudoku/v1/easy/0055.json')
        expect(result.current.isLoading).toBe(false)
        expect(store().puzzles).toEqual(expectedNextEasyPuzzleSources)
      })
    })
  })

  // TODO: We'll probably repurpose these tests soon
  describe.skip('loadNextSudoku', () => {
    it('returns a function to move to the next fetched puzzle', async () => {
      useManifestMock.mockReturnValue({ isLoading: false, manifest: defaultVersionManifest })
      getRandomIntMock.mockReturnValue(55)
      getXRandomUniqueNumbersMock.mockReturnValue([0, 1, 2, 3, 4])
      const expectedPuzzleSources = generatePuzzleSources(5)
      fetchDifficultyAPISpy.mockResolvedValueOnce(expectedPuzzleSources)

      const { result } = renderHook(() => useDifficulty())

      expect(fetchDifficultyAPISpy).toHaveBeenCalledWith('/sudoku/v1/easy/0055.json')
      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        // expect(result.current.loadNextSudoku).not.toBeNull()
      })
    })

    it('does not move to next puzzle if hook is currently loading', async () => {
      useManifestMock.mockReturnValue({ isLoading: false, manifest: defaultVersionManifest })
      getRandomIntMock.mockReturnValue(55)
      getXRandomUniqueNumbersMock.mockReturnValue([0, 1, 2, 3, 4])
      const expectedPuzzleSources = generatePuzzleSources(5)
      fetchDifficultyAPISpy.mockResolvedValueOnce(expectedPuzzleSources)

      const { result } = renderHook(() => useDifficulty())

      expect(result.current.isLoading).toBe(true)
      act(() => {
        // result.current.loadNextSudoku()
      })
      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        // expect(result.current.currentSudoku).toEqual(expectedPuzzleSources[0]) // still at index 0
      })
    })

    it('returns next cached puzzle when loadNextSudoku is called without refetching again', async () => {
      useManifestMock.mockReturnValue({ isLoading: false, manifest: defaultVersionManifest })
      getRandomIntMock.mockReturnValue(55)
      getXRandomUniqueNumbersMock.mockReturnValue([0, 1, 2, 3, 4])
      const expectedPuzzleSources = generatePuzzleSources(5)
      fetchDifficultyAPISpy.mockResolvedValueOnce(expectedPuzzleSources)

      const { result } = renderHook(() => useDifficulty())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        // expect(result.current.currentSudoku).toEqual(expectedPuzzleSources[0])
      })

      act(() => {
        // result.current.loadNextSudoku()
      })

      await vi.waitFor(() => {
        // expect(result.current.currentSudoku).toEqual(expectedPuzzleSources[1])
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

      const { result } = renderHook(() => useDifficulty())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        // expect(result.current.currentSudoku).toEqual(expectedPuzzleSources[0])
      })

      act(() => {
        // result.current.loadNextSudoku()
      })
      expect(result.current.isLoading).toBe(true)
      expect(fetchDifficultyAPISpy).toHaveBeenCalledTimes(2)
    })

    it('resets game pointer when refreshing puzzle cache', async () => {
      useManifestMock.mockReturnValue({ isLoading: false, manifest: defaultVersionManifest })
      getRandomIntMock.mockReturnValue(55)
      getXRandomUniqueNumbersMock.mockReturnValue([0, 1])
      const expectedPuzzleSources = generatePuzzleSources(2)
      const nextExpectedPuzzleSources = generatePuzzleSources(2)
      fetchDifficultyAPISpy
        .mockResolvedValueOnce(expectedPuzzleSources)
        .mockResolvedValueOnce(nextExpectedPuzzleSources)

      const { result } = renderHook(() => useDifficulty())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        // expect(result.current.currentSudoku).toEqual(expectedPuzzleSources[0])
      })

      act(() => {
        // result.current.loadNextSudoku()
      })

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        // expect(result.current.currentSudoku).toEqual(expectedPuzzleSources[1])
      })

      act(() => {
        // result.current.loadNextSudoku() // will refresh cache
      })

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        // expect(result.current.currentSudoku).toEqual(nextExpectedPuzzleSources[0])
      })
    })
  })

  describe('error', () => {
    it('returns an error when fetching manifest errors', async () => {
      useManifestMock.mockReturnValue({
        isLoading: false,
        manifest: null,
        error: new Error('Manifest failed'),
      })

      const { result } = renderHook(() => useDifficulty())

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

      const { result } = renderHook(() => useDifficulty())

      await vi.waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error)
        expect(result.current.error?.message).toBe('Difficulty fetch failed')
        expect(result.current.isLoading).toBe(false)
      })
    })
  })
})
