export function saveToStorage<T>(key: string, value: T) {
  let serialisedValue = ''
  if (typeof value === 'object' && value !== null) {
    serialisedValue = JSON.stringify(value)
  } else {
    serialisedValue = String(value)
  }

  console.log(`"About to set key: ${key}, value: ${serialisedValue}"`)

  localStorage.setItem(key, serialisedValue)
}

export function loadFromStorage<T>(key: string): T | string | null {
  const raw = localStorage.getItem(key)

  if (raw === null) {
    return null
  }

  const trimmed = raw.trim()

  // Only attempt JSON parsing for objects and arrays
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      return JSON.parse(trimmed)
    } catch {
      return raw
    }
  }

  return raw
}
