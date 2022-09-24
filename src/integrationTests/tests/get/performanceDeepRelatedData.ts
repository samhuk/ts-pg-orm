import { DataFilterLogic, Operator } from '@samhuk/data-filter/dist/types'
import { benchmarkAsyncFn, reportBenchmark, test } from '../../common'

export const deepRelatedDataPerformanceTest = test('deep related data - performance', (stores, assert) => new Promise((res, rej) => {
  const start = performance.now()
  const numIterations = 5000

  benchmarkAsyncFn(stores, async () => {
    const userNumber = Math.ceil((Math.random() * 3)) // Random number between 1 and 3
    const userName = `User ${userNumber}` // Either "User 1", "User 2", or "User 3"
    await stores.user.get({
      fields: ['name', 'email'],
      filter: {
        logic: DataFilterLogic.AND,
        nodes: [
          { field: 'dateDeleted', op: Operator.EQUALS, val: null },
          { field: 'name', op: Operator.EQUALS, val: userName },
        ],
      },
      relations: {
        userAddress: {
          fields: ['city', 'country', 'postCode', 'streetAddress'],
          query: {
            filter: { field: 'dateDeleted', op: Operator.EQUALS, val: null },
          },
          relations: {
            user: {
              fields: ['email', 'name'],
              query: {
                filter: { field: 'dateDeleted', op: Operator.EQUALS, val: null },
              },
              relations: {
                articles: {
                  fields: ['title'],
                  query: {
                    filter: { field: 'dateDeleted', op: Operator.EQUALS, val: null },
                  },
                },
                userGroups: {
                  fields: ['name'],
                  query: {
                    filter: { field: 'dateDeleted', op: Operator.EQUALS, val: null },
                    pageSize: 2,
                  },
                },
              },
            },
          },
        },
      },
    })
  }, () => {
    reportBenchmark(numIterations, start)
    res()
  }, 5000)
}))
