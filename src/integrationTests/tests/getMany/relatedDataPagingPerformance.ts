import { benchmarkAsyncFn, test } from '../../common'
import { getResult } from './relatedDataPaging'

export const relatedDataPagingPerformanceTest = test('related data paging - performance', async (orm, assert) => {
  await benchmarkAsyncFn(async () => {
    await getResult(orm.stores)
  })
})
