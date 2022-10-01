import { readObjPropDeep, setObjPropDeep } from './obj'

describe('common/obj', () => {
  describe('setObjPropDeep', () => {
    const fn = setObjPropDeep

    test('basic test', () => {
      const obj = {
        a: {
          b: {
            c: {

            },
          },
        },
      }

      const newObj = fn(obj, ['a', 'b', 'c', 'd'], 'new value')

      expect(newObj).toEqual({
        a: {
          b: {
            c: {
              d: 'new value',
            },
          },
        },
      })
    })

    test('basic test - createIfNotExists = true', () => {
      const obj = {
        a: { },
      }

      const newObj = fn(obj, ['a', 'b', 'c', 'd'], 'new value', true)

      expect(newObj).toEqual({
        a: {
          b: {
            c: {
              d: 'new value',
            },
          },
        },
      })
    })

    test('basic test - single path segment', () => {
      const obj = {}

      const newObj = fn(obj, ['a'], 'new value', false)

      expect(newObj).toEqual({
        a: 'new value',
      })
    })
  })

  describe('readObjPropDeep', () => {
    const fn = readObjPropDeep

    test('basic test', () => {
      const obj = {
        a: {
          b: {
            c: {
              d: 'val',
            },
          },
        },
      }

      expect(fn(obj, ['a', 'b', 'c'])).toEqual({ d: 'val' })
      expect(fn(obj, ['a', 'b', 'c', 'd'])).toEqual('val')
    })

    test('basic test - single path segment', () => {
      const obj: any = {}
      expect(fn(obj, ['a'])).toEqual(undefined)

      obj.a = null
      expect(fn(obj, ['a'])).toEqual(null)

      obj.a = 'val'
      expect(fn(obj, ['a'])).toEqual('val')
    })
  })
})
