import { DataFilterLogic, Operator } from '@samhuk/data-filter/dist/types'
import { test } from '../../common'

export const basicTest = test('basic', async (orm, assert) => {
  const result = await orm.stores.user.count({
    filter: {
      logic: DataFilterLogic.OR,
      nodes: [
        { field: 'name', op: Operator.EQUALS, val: 'User 1' },
        { field: 'name', op: Operator.EQUALS, val: 'User 2' },
      ],
    },
  })

  assert(result, 2)

  const result2 = await orm.stores.user.count({
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
