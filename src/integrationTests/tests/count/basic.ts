import { DataFilterLogic, Operator } from '@samhuk/data-filter/dist/types'
import { test } from '../../common'

export const basicTest = test('basic', async (stores, assert) => {
  const result = await stores.user.count({
    filter: {
      logic: DataFilterLogic.OR,
      nodes: [
        { field: 'name', op: Operator.EQUALS, val: 'User 1' },
        { field: 'name', op: Operator.EQUALS, val: 'User 2' },
      ],
    },
  })

  assert(result, 2)

  const result2 = await stores.user.count({
    filter: {
      logic: DataFilterLogic.AND,
      nodes: [
        { field: 'name', op: Operator.EQUALS, val: 'User 1' },
        { field: 'name', op: Operator.EQUALS, val: 'User 2' },
      ],
    },
  })

  assert(result2, 0)
})
