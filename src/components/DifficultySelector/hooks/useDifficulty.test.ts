import * as api from '@/components/DifficultySelector/api'
import { getXRandomUniqueNumbers } from '@/components/DifficultySelector/helpers'
import useManifest from '@/components/DifficultySelector/hooks/useManifest'
import useGameStore, { type StoreState } from '@/components/store/useGameStore'
import { generatePuzzleSources, resetGameStore } from '@/components/testLib/helpers'
import * as randomUtils from '@/components/utils/random'
import type { VersionManifest } from '@/types'
import { renderHook } from '@testing-library/react'
import type { Mock } from 'vitest'
import useDifficulty from './useDifficulty'

vi.mock('@/components/DifficultySelector/hooks/useManifest', () => ({
  default: vi.fn(),
}))

vi.mock('@/components/DifficultySelector/helpers', async (importOriginal) => {
  return {
    ...(await importOriginal<typeof import('@/components/DifficultySelector/helpers.ts')>()),
    getXRandomUniqueNumbers: vi.fn(),
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

    getRandomIntMock = vi.spyOn(randomUtils, 'getRandomInt')
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

    it('does not attempt to load puzzles when store still hydrating even if game phase is already loading + manifest', () => {
      useManifestMock.mockReturnValueOnce({ isLoading: false, manifest: defaultVersionManifest })
      store().gamePhase = 'loading'
      store().hasHydrated = false

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

    it('starts loading difficulty chunk when store has hydrated and with a present manifest and phase is "loading"', () => {
      store().gamePhase = 'loading'
      store().hasHydrated = true
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

    describe('when no active game', () => {
      it('saves inital fetched puzzles to store cache and sets first as the active game', async () => {
        useManifestMock.mockReturnValue({ isLoading: false, manifest: defaultVersionManifest })
        getRandomIntMock.mockReturnValue(55)
        getXRandomUniqueNumbersMock.mockReturnValue([0, 1, 2, 3, 4])
        const expectedEasyPuzzleSources = generatePuzzleSources(5, 'easy')
        fetchDifficultyAPISpy.mockResolvedValueOnce(expectedEasyPuzzleSources)

        renderHook(() => useDifficulty())

        await vi.waitFor(() => {
          expect(fetchDifficultyAPISpy).toHaveBeenCalledWith('/sudoku/v1/easy/0055.json')
        })
        const expectedActiveGame = expectedEasyPuzzleSources.shift()
        expect(store().activeGame).toEqual(expectedActiveGame)
        expect(store().puzzles).toEqual(expectedEasyPuzzleSources)
      })
    })

    describe('when active game', () => {
      it('refetches puzzles for cache exhustion refill but does not update active game with them', async () => {
        useManifestMock.mockReturnValue({ isLoading: false, manifest: defaultVersionManifest })
        getRandomIntMock.mockReturnValue(55)
        store().activeGame = generatePuzzleSources(1, 'easy')[0] // random active game - doesn't matter we're about to move to new one
        getXRandomUniqueNumbersMock.mockReturnValue([0]) // small cache
        const previousCache = generatePuzzleSources(1, 'easy')
        const expectedCacheRefillPuzzles = generatePuzzleSources(1, 'easy')
        fetchDifficultyAPISpy
          .mockResolvedValueOnce(previousCache)
          .mockResolvedValueOnce(expectedCacheRefillPuzzles)

        const { result } = renderHook(() => useDifficulty())

        await vi.waitFor(() => {
          expect(fetchDifficultyAPISpy).toHaveBeenCalledWith('/sudoku/v1/easy/0055.json')
          expect(result.current.isLoading).toBe(false)
        })

        store().nextSudokuPuzzle() // uses last puzzle in cache for activeGame - triggers refetch in hook

        await vi.waitFor(() => {
          expect(fetchDifficultyAPISpy).toHaveBeenCalledWith('/sudoku/v1/easy/0055.json')
          expect(result.current.isLoading).toBe(false)
          // active game does not move to new puzzle from cache refill
          expect(store().activeGame).toEqual(previousCache[0])
          expect(store().puzzles).toEqual(expectedCacheRefillPuzzles)
        })
      })
    })

    describe('on new difficulty', () => {
      it('fetches puzzles for that difficulty and stores in cache and shifts first one as active game', async () => {
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
        const newDiffActiveGame = expectedMediumPuzzleSources.shift() // remove first puzzle for active game
        expect(store().activeGame).toEqual(newDiffActiveGame)
        expect(store().puzzles).toEqual(expectedMediumPuzzleSources)
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
