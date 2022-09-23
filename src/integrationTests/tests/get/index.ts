import { testGroup } from '../../common'
import { basicTest } from './basic'
import { deepRelatedDataTest } from './deepRelatedata'

export const getTests = testGroup(
  'get',
  basicTest,
  deepRelatedDataTest,
)
