import { Operator } from '@samhuk/data-filter/dist/types'
import { benchmarkAsyncFn, reportBenchmark, test } from '../../common'

export const basicPerformanceTest = test('basic - performance', (stores, assert) => new Promise((res, rej) => {
  const start = performance.now()
  const numIterations = 5000

  benchmarkAsyncFn(stores, async () => {
    const userNumber = Math.ceil((Math.random() * 3)) // Random number between 1 and 3
    const userName = `User ${userNumber}` // Either "User 1", "User 2", or "User 3"
    await stores.user.get({
      filter: {
        field: 'name', op: Operator.EQUALS, val: userName,
      },
      relations: {
        userAddress: {
          fields: ['city', 'country', 'postCode', 'streetAddress'],
        },
      },
    })
  }, () => {
    reportBenchmark(numIterations, start)
    res()
  }, 5000)
}))
