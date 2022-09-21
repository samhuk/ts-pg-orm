import { testGroup } from '../../common'
import { basicTest } from './basic'
import { deepRelatedDataTest } from './deepRelatedata'
import { relatedDataPagingTest } from './relatedDataPaging'

export const getTests = testGroup(
  'get',
  basicTest,
  relatedDataPagingTest,
  deepRelatedDataTest,
)
