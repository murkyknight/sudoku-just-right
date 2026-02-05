import type { VersionManifest } from '@/types'
import { loadFromStorage, saveToStorage } from '../utils/localStorageHelper'
import { fetchRootManifest, fetchVersionManifest } from './api'

export async function getLatestManifest(): Promise<VersionManifest> {
  const rootManifest = await fetchRootManifest()
  const { currentVersion, versions } = rootManifest

  const cacheKey = `sjr:manifest:${currentVersion}`
  const cachedVersionManifest = loadFromStorage<VersionManifest>(cacheKey)

  if (cachedVersionManifest) {
    return cachedVersionManifest
  }

  const currentRootVersion = versions[currentVersion]
  const versionManifest = await fetchVersionManifest(currentRootVersion.manifestPath)
  saveToStorage(cacheKey, versionManifest)

  return versionManifest
}