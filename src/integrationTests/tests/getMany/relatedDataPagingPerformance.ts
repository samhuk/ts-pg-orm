import { benchmarkAsyncFn, reportBenchmark, test } from '../../common'
import { getResult } from './relatedDataPaging'

export const relatedDataPagingPerformanceTest = test('related data paging - performance', (stores, assert) => new Promise((res, rej) => {
  const start = performance.now()
  const numIterations = 5000

  benchmarkAsyncFn(stores, async () => {
    await getResult(stores)
  }, () => {
    reportBenchmark(numIterations, start, 1800)
    res()
  }, 5000)
}))
