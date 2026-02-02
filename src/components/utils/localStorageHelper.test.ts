import { loadFromStorage, saveToStorage } from './localStorageHelper'

describe('localStorageHelper', () => {
  const setItemSpy = vi.spyOn(localStorage, 'setItem')
  const getItemSpy = vi.spyOn(localStorage, 'getItem')

  function getSetItemActualMockValues(
    { callIndex }: { callIndex: number } = { callIndex: 0 },
  ): [key: string, value: string] {
    return setItemSpy.mock.calls[callIndex]
  }

  beforeEach(() => {
    localStorage.clear()
    getItemSpy.mockClear()
    setItemSpy.mockClear()
  })

  afterEach(() => {
    localStorage.clear()
    getItemSpy.mockClear()
    setItemSpy.mockClear()
  })

  describe('saveToStorage()', () => {
    it('persists passed value with passed key', () => {
      saveToStorage('myKey', 'someValue')

      expect(setItemSpy).toHaveBeenCalledTimes(1)
      expect(setItemSpy).toHaveBeenCalledWith('myKey', 'someValue')
    })

    it('serialises simple objects', () => {
      const simpleObj = { foo: 'bar' }

      saveToStorage('myKey', simpleObj)

      const [actualKey, actualSerialized] = getSetItemActualMockValues()
      expect(setItemSpy).toHaveBeenCalledTimes(1)
      expect(actualKey).toEqual('myKey')
      expect(JSON.parse(actualSerialized)).toEqual(simpleObj)
    })

    it('serialises complex objects', () => {
      const complexObj = {
        foo: {
          bar: 'baz',
          arr: [1, 2, 3, 4],
        },
      }

      saveToStorage('myKey', complexObj)

      const [actualKey, actualSerialized] = getSetItemActualMockValues()
      expect(setItemSpy).toHaveBeenCalledTimes(1)
      expect(actualKey).toEqual('myKey')
      expect(JSON.parse(actualSerialized)).toEqual(complexObj)
    })

    it('does not serialise value if string', () => {
      const stringifySpy = vi.spyOn(JSON, 'stringify')

      saveToStorage('myKey', 'someValue')

      expect(stringifySpy).not.toHaveBeenCalled()
      stringifySpy.mockRestore()
    })

    it('stringifies numbers', () => {
      saveToStorage('num', 42)

      expect(setItemSpy).toHaveBeenCalledWith('num', '42')
    })

    it('stringifies booleans', () => {
      saveToStorage('bool', true)

      expect(setItemSpy).toHaveBeenCalledWith('bool', 'true')
    })

    it('stringifies null', () => {
      saveToStorage('nullKey', null)

      expect(setItemSpy).toHaveBeenCalledWith('nullKey', 'null')
    })

    it('stringifies undefined', () => {
      saveToStorage('undefKey', undefined)

      expect(setItemSpy).toHaveBeenCalledWith('undefKey', 'undefined')
    })

    it('serialises arrays', () => {
      const arr = [1, 2, 3]
      saveToStorage('arr', arr)

      const [, value] = getSetItemActualMockValues()
      expect(JSON.parse(value)).toEqual(arr)
    })

    it('stringifies functions using String()', () => {
      saveToStorage('fn', () => {})

      const [, value] = getSetItemActualMockValues()
      expect(value).toContain('=>')
    })
  })

  describe('loadFromStorage()', () => {
    it('returns null when value does not exist', () => {
      const value = loadFromStorage('key-does-not-exist')

      expect(value).toBeNull()
    })

    it('returns string when value is not an object', () => {
      saveToStorage('myKey', 'someValue')

      const value = loadFromStorage<string>('myKey')

      expect(value).toEqual('someValue')
    })

    it('does not validate runtime shape against generic type', () => {
      localStorage.setItem('bad', JSON.stringify({ wrong: true }))

      const value = loadFromStorage<{ expected: string }>('bad')

      expect(value).toEqual({ wrong: true })
    })

    it('returns object of passed type when key found', () => {
      type Inner = {
        bar: string
        arr: number[]
      }
      type Complex = {
        foo: Inner
      }
      const complexObj: Complex = {
        foo: {
          bar: 'baz',
          arr: [1, 2, 3, 4],
        },
      }
      saveToStorage('myKey', complexObj)

      const value = loadFromStorage<Complex>('myKey')

      if (value === null || typeof value === 'string') {
        throw new Error('Value should not be null')
      }
      expectTypeOf(value).toEqualTypeOf<Complex>()
      expect(value).toEqual(complexObj)
    })

    it('returns raw string when JSON.parse fails', () => {
      localStorage.setItem('bad', '{not:valid:json')

      const value = loadFromStorage('bad')

      expect(value).toEqual('{not:valid:json')
    })

    it('keeps numeric strings as strings', () => {
      localStorage.setItem('num', '42')
      expect(loadFromStorage('num')).toBe('42')
    })

    it('keeps boolean strings as strings', () => {
      localStorage.setItem('bool', 'true')
      expect(loadFromStorage('bool')).toBe('true')
    })

    it('parses JSON objects', () => {
      localStorage.setItem('obj', '{"a":1}')
      expect(loadFromStorage('obj')).toEqual({ a: 1 })
    })

    it('parses JSON arrays', () => {
      localStorage.setItem('arr', '[1,2]')
      expect(loadFromStorage('arr')).toEqual([1, 2])
    })

    it('returns raw string for invalid JSON object', () => {
      localStorage.setItem('bad', '{not valid}')
      expect(loadFromStorage('bad')).toBe('{not valid}')
    })

    it('returns empty string when stored value is an empty string', () => {
      localStorage.setItem('empty', '')

      const value = loadFromStorage('empty')

      expect(value).toBe('')
    })
  })
})
