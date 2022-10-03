import { removeDuplicates, removeNullishValues } from './array'

describe('helpers/array', () => {
  describe('removeDuplicates', () => {
    const fn = removeDuplicates

    test('basic test', () => {
      expect(fn([1, 2, 2, 3, 3])).toEqual([1, 2, 3])
      expect(fn(['a', 'b', 'c', 'c'])).toEqual(['a', 'b', 'c'])
    })

    test('nullish array', () => {
      expect(fn(null)).toEqual(null)
      expect(fn(undefined)).toEqual(null)
      expect(fn([])).toEqual([])
    })

    test('empty array', () => {
      expect(fn([])).toEqual([])
    })
  })

  describe('removeNullishValues', () => {
    const fn = removeNullishValues

    test('basic test', () => {
      expect(fn([1, null, 2, undefined, 3])).toEqual([1, 2, 3])
      expect(fn([null, null, undefined, undefined])).toEqual([])
      expect(fn([null, null, undefined, undefined, 1])).toEqual([1])
    })

    test('nullish array', () => {
      expect(fn(null)).toEqual(null)
      expect(fn(undefined)).toEqual(null)
      expect(fn([])).toEqual([])
    })

    test('empty array', () => {
      expect(fn([])).toEqual([])
    })
  })
})
