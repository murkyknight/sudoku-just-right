
export function saveToStorage<T>(key: string, value: T) {
  let serialisedValue = ''
  if (typeof value === 'object') {
    serialisedValue = JSON.stringify(value)
  }

  localStorage.setItem(key, serialisedValue ?? value)
}

export function loadFromStorage<T>(key: string): T | null {
  const rawJson = localStorage.getItem(key)

  let item: T | null = null
  if (rawJson) {
    item = JSON.parse(rawJson)
  }

  return item
}

