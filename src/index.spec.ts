import { createMyComponent } from '.'

describe('createMyComponent', () => {
  const fn = createMyComponent

  test('basic test of initial values', () => {
    const instance = fn({
      initialFoo: 'a',
    })

    expect(instance.foo).toBe('a')
  })

  test('updateFoo', () => {
    const instance = fn({
      initialFoo: 'a',
    })

    instance.updateFoo('b')

    expect(instance.foo).toBe('b')
  })
})
