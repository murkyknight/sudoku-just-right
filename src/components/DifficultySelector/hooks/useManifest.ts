import type { VersionManifest } from '@/types'
import { useCallback, useEffect, useState } from 'react'
import { getLatestManifest } from '../helpers'

export default function useManifest() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [gameManifest, setGameManifest] = useState<VersionManifest>()

  const loadManifest = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const latestManifest = await getLatestManifest()
      setGameManifest(latestManifest)
    } catch (err) {
      if (err instanceof Error) {
        console.error(err)
        setError(err)
      } else {
        // don't know what this is, throw to ErrorBoundary
        throw err
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
   loadManifest()
  }, [loadManifest])

  return {
    isLoading,
    error,
    manifest: gameManifest,
  }
}
