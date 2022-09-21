import { testGroup } from '../../common'
import { basicTest } from './basic'
import { fullQueryTest } from './fullQuery'

export const deleteTests = testGroup(
  'delete',
  basicTest,
  fullQueryTest,
)
