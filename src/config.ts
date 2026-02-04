/**
 * The env vars should be lazy loaded at run time, not at import time.
 * This way, stubbing them in tests is possible. 
 */
export function getConfig() {
  return {
    cdnBaseUrl: import.meta.env.VITE_SJR_PUZZLE_BASE_URL,
  }
}