import { benchmarkAsyncFn, test } from '../../common'
import { getResult } from './relatedDataPaging'

export const relatedDataPagingPerformanceTest = test('related data paging - performance', async (stores, assert) => {
  await benchmarkAsyncFn(async () => {
    await getResult(stores)
  })
})
