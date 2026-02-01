import { HttpError } from '@/api/errors/HttpError'
import type { RootManifest, VersionManifest } from '@types'

const CDN_BASE_URL = import.meta.env.VITE_SJR_PUZZLE_BASE_URL

// TODO: Cover in tests - these will throw a HttpError for non 200 successful requests
// The will throw TypeError's for Network failure

export async function fetchRootManifest(): Promise<RootManifest> {
  const res = await fetch(`${CDN_BASE_URL}/manifest.json`)
  if (!res.ok) {
    throw HttpError.withOp(res, 'fetchRootManifest')
  }

  return res.json()
}

export async function fetchVersionManifest(manifestVersionPath: string): Promise<VersionManifest> {
  const res = await fetch(`${CDN_BASE_URL}/${manifestVersionPath}`)
  if (!res.ok) {
    throw HttpError.withOp(res, 'fetchVersionManifest')
  }

  return res.json()
}
