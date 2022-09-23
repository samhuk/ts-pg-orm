import { testGroup } from '../../common'
import { basicTest } from './basic'
import { relatedDataPagingTest } from './relatedDataPaging'

export const getManyTests = testGroup(
  'get many',
  basicTest,
  relatedDataPagingTest,
)
