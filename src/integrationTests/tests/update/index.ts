import { testGroup } from '../../common'
import { basicTest } from './basic'
import { fullQueryTest } from './fullQuery'

export const updateTests = testGroup(
  'get',
  basicTest,
  fullQueryTest,
)
