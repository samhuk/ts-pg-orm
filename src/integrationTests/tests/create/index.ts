import { testGroup } from '../../common'
import { basicTest } from './basic'
import { jsonTest } from './json'

export const createTests = testGroup(
  'create',
  basicTest,
  jsonTest,
)
