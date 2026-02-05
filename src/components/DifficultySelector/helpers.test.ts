import type { HttpError } from '@/api/errors/HttpError'
import * as storage from '@/components/utils/localStorageHelper'
import type { RootManifest, VersionManifest } from '@/types'
import type { Mock } from 'vitest'
import { badRequestResponse, okResponse } from '../testLib/helpers/api'
import { getLatestManifest } from './helpers'

function createRootManifest(version: string): RootManifest {
  return {
    currentVersion: version,
    versions: {
      [version]: {
        basePath: '/basePath',
        manifestPath: `/${version}/manifestPath/manifest.json`,
      },
    },
  }
}

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

  afterAll(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  describe('getLatestManifest', () => {
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

      expect(saveToStorageSpy).toHaveBeenCalledWith('v1', defaultVersionManifest)
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
      expect(saveToStorageSpy).toHaveBeenCalledWith('v2', v2VrsionManifest)
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

      try {
        await getLatestManifest()
      } catch (e) {
        const error = e as HttpError
        expect(error.message).toEqual('HTTP 400 (fetchRootManifest)')
        expect(fetchSpy).toHaveBeenCalledWith(`${BASE_URL}/manifest.json`)
        return
      }
      assert.fail('Should have thrown HttpError')
    })

    it('throws HttpError when root manifest returns non 2xx 2', async () => {
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
})
