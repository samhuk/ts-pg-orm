import { testGroup } from '../../common'
import { basicTest } from './basic'
import { deepRelatedDataTest } from './deepRelatedata'
import { basicPerformanceTest } from './performanceBasic'
import { deepRelatedDataPerformanceTest } from './performanceDeepRelatedData'

export const getTests = testGroup(
  'get',
  basicTest,
  deepRelatedDataTest,
  basicPerformanceTest,
  deepRelatedDataPerformanceTest,
)
