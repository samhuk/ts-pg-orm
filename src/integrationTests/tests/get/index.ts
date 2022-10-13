import { testGroup } from '../../common'
import { basicExcludeFieldsTest, basicTest } from './basic'
import { deepRelatedDataExcludeFieldsTest, deepRelatedDataTest } from './deepRelatedData'
import { basicPerformanceTest } from './basicPerformance'
import { deepRelatedDataPerformanceTest } from './deepRelatedDataPerformance'

export const getTests = testGroup(
  'get',
  basicTest,
  basicExcludeFieldsTest,
  deepRelatedDataTest,
  deepRelatedDataExcludeFieldsTest,
)

export const getPerformanceTests = testGroup(
  'get (performance)',
  basicPerformanceTest,
  deepRelatedDataPerformanceTest,
)
