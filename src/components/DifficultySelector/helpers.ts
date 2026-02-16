import type { VersionManifest } from '@/types'
import { loadFromStorage, saveToStorage } from '../utils/localStorageHelper'
import { getRandomInt } from '../utils/random'
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

export function getXRandomUniqueNumbers(maxUpperBound: number, amount: number): number[] {
  const selectedNumbers: number[] = []
  while (selectedNumbers.length < amount) {
    const randomInt = getRandomInt(maxUpperBound)
    const hasSameNumber = selectedNumbers.some((num) => num === randomInt)

    if (!hasSameNumber) {
      selectedNumbers.push(randomInt)
    }
  }
  return selectedNumbers
}

export function zeroPadNumber(num: number, width: number) {
  const s = String(num)
  if (s.length >= width) {
    return s
  }
  return '0'.repeat(width - s.length) + s
}