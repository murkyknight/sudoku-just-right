import * as storage from '@/components/utils/localStorageHelper'
import * as randomUtils from '@/components/utils/random'
import type { RootManifest, VersionManifest } from '@/types'
import type { Mock } from 'vitest'
import { createRootManifest } from '../testLib/helpers'
import { badRequestResponse, okResponse } from '../testLib/helpers/api'
import { getLatestManifest, getXRandomUniqueNumbers } from './helpers'

const rootManiDefault: RootManifest = createRootManifest('v1')
const rootManiV2: RootManifest = createRootManifest('v2')

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

describe('helpers', () => {
  afterAll(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  describe('getLatestManifest', () => {
    let fetchSpy: Mock
    let saveToStorageSpy: Mock
    let loadFromStorageSpy: Mock
    const BASE_URL = 'https://test.api'

    beforeEach(() => {
      localStorage.clear()
      vi.restoreAllMocks()

      vi.stubEnv('VITE_SJR_PUZZLE_BASE_URL', BASE_URL)
      fetchSpy = vi.spyOn(global, 'fetch')
      loadFromStorageSpy = vi.spyOn(storage, 'loadFromStorage')
      saveToStorageSpy = vi.spyOn(storage, 'saveToStorage')
    })

    it('fetches and returns verison manifest if not found in cache', async () => {
      loadFromStorageSpy.mockReturnValue(null)
      fetchSpy
        .mockResolvedValueOnce(okResponse(rootManiDefault))
        .mockResolvedValueOnce(okResponse(defaultVersionManifest))

      const versionManifest = await getLatestManifest()

      expect(versionManifest).toEqual(defaultVersionManifest)
      expect(fetchSpy).toHaveBeenCalledTimes(2)
      expect(fetchSpy).toHaveBeenCalledWith(`${BASE_URL}/manifest.json`)
      expect(fetchSpy).toHaveBeenCalledWith(`${BASE_URL}/v1/manifestPath/manifest.json`)
    })

    it('caches fetched verison manifest', async () => {
      loadFromStorageSpy.mockReturnValue(null)
      fetchSpy
        .mockResolvedValueOnce(okResponse(rootManiDefault))
        .mockResolvedValueOnce(okResponse(defaultVersionManifest))

      await getLatestManifest()

      expect(saveToStorageSpy).toHaveBeenCalledWith(`sjr:manifest:v1`, defaultVersionManifest)
    })

    it('loads verison manifest from cache when it exists', async () => {
      loadFromStorageSpy.mockReturnValue(defaultVersionManifest)
      fetchSpy
        .mockResolvedValueOnce(okResponse(rootManiDefault))
        .mockResolvedValueOnce(okResponse(defaultVersionManifest))

      const expectedCachedVersionManifest = await getLatestManifest()

      expect(expectedCachedVersionManifest).toEqual(defaultVersionManifest)
      expect(saveToStorageSpy).not.toHaveBeenCalled()
    })

    it('does not fetch version manifest if wanted version is found in cache', async () => {
      loadFromStorageSpy.mockReturnValue(defaultVersionManifest)
      fetchSpy
        .mockResolvedValueOnce(okResponse(rootManiDefault))
        .mockResolvedValueOnce(okResponse(defaultVersionManifest))

      await getLatestManifest()

      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(fetchSpy).toHaveBeenCalledWith(`${BASE_URL}/manifest.json`)
      expect(fetchSpy).not.toHaveBeenCalledWith(`${BASE_URL}/v1/manifestPath/manifest.json`)
      expect(saveToStorageSpy).not.toHaveBeenCalled()
    })

    it('re-fetches and saves updated verison manifest if version differs from cache', async () => {
      const v2VrsionManifest = { version: 'v2' } as VersionManifest
      loadFromStorageSpy.mockReturnValue(null) // not found in cache
      fetchSpy
        .mockResolvedValueOnce(okResponse(rootManiV2))
        .mockResolvedValueOnce(okResponse(v2VrsionManifest))

      const expectedCachedVersionManifest = await getLatestManifest()

      expect(expectedCachedVersionManifest).toEqual(v2VrsionManifest)
      expect(fetchSpy).toHaveBeenCalledWith(`${BASE_URL}/v2/manifestPath/manifest.json`)
      expect(saveToStorageSpy).toHaveBeenCalledWith(`sjr:manifest:v2`, v2VrsionManifest)
    })

    it('fetches the root manifest every time it is called', async () => {
      // version manifest not found in cache
      loadFromStorageSpy.mockReturnValueOnce(null)
      fetchSpy
        .mockResolvedValueOnce(okResponse(rootManiDefault))
        .mockResolvedValueOnce(okResponse(defaultVersionManifest))
      await getLatestManifest()
      expect(fetchSpy).toHaveBeenCalledWith(`${BASE_URL}/manifest.json`)

      // version manifest found in cache - no need to fetch it
      fetchSpy.mockClear()
      loadFromStorageSpy.mockReturnValueOnce(defaultVersionManifest)
      fetchSpy.mockResolvedValueOnce(okResponse(rootManiDefault))
      await getLatestManifest()
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(fetchSpy).toHaveBeenCalledWith(`${BASE_URL}/manifest.json`)
    })

    it('throws HttpError when root manifest returns non 2xx', async () => {
      fetchSpy.mockResolvedValueOnce(badRequestResponse())

      await expect(getLatestManifest()).rejects.toMatchObject({
        name: 'HttpError',
        message: 'HTTP 400 (fetchRootManifest)',
      })

      expect(fetchSpy).toHaveBeenCalledWith(`${BASE_URL}/manifest.json`)
    })

    it('throws HttpError when version manifest returns non 2xx', async () => {
      fetchSpy
        .mockResolvedValueOnce(okResponse(rootManiDefault))
        .mockResolvedValueOnce(badRequestResponse())

      await expect(getLatestManifest()).rejects.toMatchObject({
        name: 'HttpError',
        message: 'HTTP 400 (fetchVersionManifest)',
      })

      expect(fetchSpy).toHaveBeenLastCalledWith(`${BASE_URL}/v1/manifestPath/manifest.json`)
    })
  })

  describe('getXRandomUniqueNumbers', () => {
    let getRandomIntSpy: Mock

    beforeEach(() => {
      vi.restoreAllMocks()
      getRandomIntSpy = vi.spyOn(randomUtils, 'getRandomInt')
    })

    afterAll(() => {
      vi.restoreAllMocks()
    })

    it('returns the requested amount of unique numbers', () => {
      const maxUpperBound = 10
      const amount = 3
      getRandomIntSpy
        .mockImplementationOnce(() => 1)
        .mockImplementationOnce(() => 2)
        .mockImplementationOnce(() => 3)

      const result = getXRandomUniqueNumbers(maxUpperBound, amount)

      expect(result).toHaveLength(amount)
      expect(new Set(result).size).toBe(amount)
    })

    it('skips duplicates from the random generator and returns unique numbers', () => {
      const maxUpperBound = 5
      const amount = 3
      getRandomIntSpy
        .mockImplementationOnce(() => 2)
        .mockImplementationOnce(() => 2)
        .mockImplementationOnce(() => 3)
        .mockImplementationOnce(() => 3)
        .mockImplementationOnce(() => 4)

      const result = getXRandomUniqueNumbers(maxUpperBound, amount)

      expect(result).toEqual([2, 3, 4])
    })

    it('keeps calling getRandomInt until amount unique numbers collected and passes maxUpperBound', () => {
      const maxUpperBound = 8
      const amount = 2
      getRandomIntSpy
        .mockImplementationOnce(() => 1)
        .mockImplementationOnce(() => 1)
        .mockImplementationOnce(() => 1)
        .mockImplementationOnce(() => 2)

      const result = getXRandomUniqueNumbers(maxUpperBound, amount)

      expect(result).toEqual([1, 2])
      expect(getRandomIntSpy).toHaveBeenCalledTimes(4)
      expect(getRandomIntSpy).toHaveBeenCalledWith(maxUpperBound)
    })
  })
})
