import { testGroup } from '../../common'
import { basicTest } from './basic'
import { relatedDataPagingTest } from './relatedDataPaging'
import { relatedDataPagingPerformanceTest } from './relatedDataPagingPerformance'

export const getManyTests = testGroup(
  'get many',
  basicTest,
  relatedDataPagingTest,
)

export const getManyPerformanceTests = testGroup(
  'get many (performance)',
  relatedDataPagingPerformanceTest,
)
