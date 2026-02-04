import { loadFromStorage, saveToStorage } from './localStorageHelper'

describe('localStorageHelper', () => {
  const setItemSpy = vi.spyOn(localStorage, 'setItem')
  const getItemSpy = vi.spyOn(localStorage, 'getItem')

  /**
   * When you want the serialised result to then act and assert on (usually JSON.parse())
   * By passes the need to create the serialised object manually.
   */
  function getSetItemActualMockValues(
    { callIndex }: { callIndex: number } = { callIndex: 0 },
  ): [key: string, value: string] {
    return setItemSpy.mock.calls[callIndex]
  }

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('saveToStorage()', () => {
    it('persists passed value with passed key', () => {
      saveToStorage('myKey', 'someValue')

      expect(setItemSpy).toHaveBeenCalledTimes(1)
      expect(setItemSpy).toHaveBeenCalledWith('myKey', '"someValue"')
    })

    it('allows saving key with same value twice', () => {
      saveToStorage('myKey', 'someValue')
      saveToStorage('myKey', 'someValue')

      expect(setItemSpy).toHaveBeenCalledTimes(2)
      expect(setItemSpy).toHaveBeenCalledWith('myKey', '"someValue"')
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

    it('stringifies strings', () => {
      saveToStorage('str', 'foo')

      expect(setItemSpy).toHaveBeenCalledWith('str', '"foo"')
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

    it('stringifies undefined to undefined', () => {
      saveToStorage('undefKey', undefined)

      expect(setItemSpy).toHaveBeenCalledWith('undefKey', undefined)
    })

    it('stringifies arrays', () => {
      const arr = [1, 2, 3]
      saveToStorage('arr', arr)

      const [, serialisedArrValue] = getSetItemActualMockValues()
      expect(JSON.parse(serialisedArrValue)).toEqual(arr)
    })

    it('stringifies functions to undefined', () => {
      saveToStorage('fn', () => {})

      const [_, actualSerialized] = getSetItemActualMockValues()
      expect(actualSerialized).toEqual(undefined)
      expect(setItemSpy).toHaveBeenCalledWith('fn', undefined)
    })
  })

  describe('loadFromStorage()', () => {
    it('returns null when value does not exist', () => {
      const value = loadFromStorage('key-does-not-exist')

      expect(getItemSpy).toHaveBeenCalledTimes(1)
      expect(getItemSpy).toHaveBeenCalledWith('key-does-not-exist')
      expect(value).toBeNull()
    })

    it('returns updated value when using same key with different value', () => {
      saveToStorage('myKey', 'firstValue')
      saveToStorage('myKey', 'secondValue')

      const value = loadFromStorage('myKey')

      expect(value).toEqual('secondValue')
    })

    it('does not validate runtime shape against generic type', () => {
      saveToStorage('bad', { wrong: true })

      const value = loadFromStorage<{ expected: string }>('bad')

      expect(value).toEqual({ wrong: true })
    })

    it('returns the stored value typed as the requested generic', () => {
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

      if (value === null) {
        throw new Error('Value should not be null or a string')
      }
      expectTypeOf(value).toEqualTypeOf<Complex>()
      expect(value).toEqual(complexObj)
    })

    it('parses objects', () => {
      saveToStorage('obj', { a: 1 })

      expect(loadFromStorage('obj')).toEqual({ a: 1 })
    })

    it('parses arrays', () => {
      saveToStorage('arr', [1, '2'])

      expect(loadFromStorage('arr')).toEqual([1, '2'])
    })

    it('keeps numeric strings as strings', () => {
      saveToStorage('num', '42')

      expect(loadFromStorage('num')).toBe('42')
    })

    it('keeps numbers as numbers', () => {
      saveToStorage('num', 42)

      const result = loadFromStorage<number>('num')

      expect(result).toBe(42)
    })

    it('keeps boolean strings as strings', () => {
      saveToStorage('bool', 'true')

      expect(loadFromStorage('bool')).toBe('true')
    })

    it('keeps boolean as boolean', () => {
      saveToStorage('bool', true)

      const result = loadFromStorage<number>('bool')

      expect(result).toBe(true)
    })

    it('returns empty string when stored value is an empty string', () => {
      saveToStorage('empty', '')

      const value = loadFromStorage('empty')

      expect(value).toBe('')
    })

    describe('loading variables saved with raw localStroage.setItem, not helper', () => {
      it('returns null when JSON.parse fails', () => {
        localStorage.setItem('bad', '{not:valid:json')

        const value = loadFromStorage('bad')

        expect(value).toEqual(null)
      })
    })
  })
})
