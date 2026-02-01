import type { VersionManifest } from "@/types";
import { loadFromStorage, saveToStorage } from "../utils/localStorageHelpers";
import { fetchRootManifest, fetchVersionManifest } from "./api";

export async function getLatestManifest(): Promise<VersionManifest> {
  const rootManifest = await fetchRootManifest()
  const { currentVersion, versions } = rootManifest

  const cachedVersionManifest = loadFromStorage<VersionManifest>(currentVersion)

  if (cachedVersionManifest) {
    return cachedVersionManifest
  }

  const currentRootVersion = versions[currentVersion]
  const versionManifest = await fetchVersionManifest(currentRootVersion.manifestPath)
  saveToStorage(currentVersion, versionManifest)

  return versionManifest
}