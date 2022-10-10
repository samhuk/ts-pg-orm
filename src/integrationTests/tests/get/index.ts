import { testGroup } from '../../common'
import { basicTest } from './basic'
import { deepRelatedDataTest } from './deepRelatedData'
import { basicPerformanceTest } from './basicPerformance'
import { deepRelatedDataPerformanceTest } from './deepRelatedDataPerformance'

export const getTests = testGroup(
  'get',
  basicTest,
  deepRelatedDataTest,
)

export const getPerformanceTests = testGroup(
  'get (performance)',
  basicPerformanceTest,
  deepRelatedDataPerformanceTest,
)
