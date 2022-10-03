import { mapDict, toDict, toDictReadonly } from './dict'

describe('helpers/dict', () => {
  describe('mapDict', () => {
    const fn = mapDict

    test('basic test', () => {
      expect(fn({ a: 1, b: 2, c: 3 }, (v, k) => `${v + 1}${k}`)).toEqual({ a: '2a', b: '3b', c: '4c' })
    })

    test('nullish dict', () => {
      expect(fn(null, null)).toEqual(null)
      expect(fn(undefined, null)).toEqual(null)
    })

    test('empty dict', () => {
      expect(fn({}, null)).toEqual({})
    })
  })

  describe('toDict', () => {
    const fn = toDict

    test('basic test', () => {
      expect(fn(['a', 'b', 'c'], (v, i) => ({ key: v, value: `${i + 1}${v}` }))).toEqual({ a: '1a', b: '2b', c: '3c' })
    })

    test('nullish array', () => {
      expect(fn(null, null)).toEqual(null)
      expect(fn(undefined, null)).toEqual(null)
    })

    test('empty array', () => {
      expect(fn([], null)).toEqual({})
    })
  })

  describe('toDict', () => {
    const fn = toDictReadonly

    test('basic test', () => {
      expect(fn(['a', 'b', 'c'], (v, i) => ({ key: v, value: `${i + 1}${v}` }))).toEqual({ a: '1a', b: '2b', c: '3c' })
    })

    test('nullish array', () => {
      expect(fn(null, null)).toEqual(null)
      expect(fn(undefined, null)).toEqual(null)
    })

    test('empty array', () => {
      expect(fn([], null)).toEqual({})
    })
  })
})
