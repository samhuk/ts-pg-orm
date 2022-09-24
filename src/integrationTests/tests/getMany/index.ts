import { testGroup } from '../../common'
import { basicTest } from './basic'
import { relatedDataPagingTest } from './relatedDataPaging'
import { relatedDataPagingPerformanceTest } from './relatedDataPagingPerformance'

export const getManyTests = testGroup(
  'get many',
  basicTest,
  relatedDataPagingTest,
  relatedDataPagingPerformanceTest,
)
