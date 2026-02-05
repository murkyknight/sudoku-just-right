import { HttpError } from '@/api/errors/HttpError'
import * as manifestHelper from '@/components/DifficultySelector/helpers'
import { badRequestResponse } from '@/components/testLib/helpers/api'
import type { VersionManifest } from '@/types'
import { renderHook } from '@testing-library/react'
import type { Mock } from 'vitest'
import useManifest from './useManifest'

describe('useManifest', () => {
  let getLatestManifestSpy: Mock
  const basicVersionManifest = { version: 'v1' } as VersionManifest

  beforeEach(() => {
    getLatestManifestSpy = vi.spyOn(manifestHelper, 'getLatestManifest')
    getLatestManifestSpy.mockResolvedValueOnce(basicVersionManifest)
  })

  afterEach(() => { vi.clearAllMocks() })

  afterAll(() => vi.restoreAllMocks())

  it('returns isLoading true when loading manifest', async () => {
    const { result, unmount } = renderHook(() => useManifest())

    expect(result.current.isLoading).toBe(true)
    unmount()
  })

  it('returns isLoading false when finished loading manifest', async () => {
    const { result } = renderHook(() => useManifest())

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(getLatestManifestSpy).toHaveBeenCalledTimes(1)
    })
  })

  it('returns manifest once loaded', async () => {
    const { result } = renderHook(() => useManifest())

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.manifest).toEqual(basicVersionManifest)
    })
  })

  it('returns cached manifest when calling hook again (no new fetch)', async () => {
    const { result, rerender } = renderHook(() => useManifest())
    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(getLatestManifestSpy).toHaveBeenCalledTimes(1)
      expect(result.current.manifest).toEqual(basicVersionManifest)
    })

    getLatestManifestSpy.mockClear()
    rerender()
    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(getLatestManifestSpy).not.toHaveBeenCalled()
      expect(result.current.manifest).toEqual(basicVersionManifest)
    })
  })

  it('re-fetches manifest when hook is unmounted and remounted', async () => {
    const { result: firstResult } = renderHook(() => useManifest())
    await vi.waitFor(() => {
      expect(firstResult.current.isLoading).toBe(false)
      expect(getLatestManifestSpy).toHaveBeenCalledTimes(1)
      expect(firstResult.current.manifest).toEqual(basicVersionManifest)
    })

    getLatestManifestSpy.mockClear()
    const v2VersionManifest = { version: 'v2' } as VersionManifest
    getLatestManifestSpy.mockResolvedValueOnce(v2VersionManifest)
    const { result: secondResult } = renderHook(() => useManifest())
    await vi.waitFor(() => {
      expect(secondResult.current.isLoading).toBe(false)
      expect(getLatestManifestSpy).toHaveBeenCalledTimes(1)
      expect(secondResult.current.manifest).toEqual(v2VersionManifest)
    })
  })

  it('returns error when fetching manifest returns non 2xx', async () => {
    getLatestManifestSpy.mockReset()
    const basicHttpError: HttpError = new HttpError(badRequestResponse())
    getLatestManifestSpy.mockRejectedValue(basicHttpError)

    const { result } = renderHook(() => useManifest())

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(getLatestManifestSpy).toHaveBeenCalledTimes(1)
      expect(result.current.error).toEqual(basicHttpError)
      expect(result.current.manifest).toEqual(undefined)
    })
  })
})
