import { HttpError } from '@/api/errors/HttpError'
import { getConfig } from '@/config'
import type { RootManifest, VersionManifest } from '@/types'

// TODO: Cover in tests - these will throw a HttpError for non 200 successful requests
// The will throw TypeError's for Network failure

export async function fetchRootManifest(): Promise<RootManifest> {
  const { cdnBaseUrl } = getConfig()
  const res = await fetch(`${cdnBaseUrl}/manifest.json`)
  if (!res.ok) {
    throw HttpError.withOp(res, 'fetchRootManifest')
  }

  return res.json()
}

export async function fetchVersionManifest(manifestVersionPath: string): Promise<VersionManifest> {
  const { cdnBaseUrl } = getConfig()
  const res = await fetch(`${cdnBaseUrl}${manifestVersionPath}`)
  if (!res.ok) {
    throw HttpError.withOp(res, 'fetchVersionManifest')
  }

  return res.json()
}
