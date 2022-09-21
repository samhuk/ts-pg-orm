import { setObjPropDeep } from './obj'

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
