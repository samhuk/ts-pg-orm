import { DataFilterLogic, Operator } from '@samhuk/data-filter/dist/types'
import { test } from '../../common'

export const basicTest = test('basic', async (stores, assert) => {
  const result = await stores.user.exists({
    filter: {
      logic: DataFilterLogic.OR,
      nodes: [
        { field: 'name', op: Operator.EQUALS, val: 'User 1' },
        { field: 'name', op: Operator.EQUALS, val: 'User 2' },
      ],
    },
  })

  assert(result, true)

  const result2 = await stores.user.exists({
    filter: {
      logic: DataFilterLogic.AND,
      nodes: [
        { field: 'name', op: Operator.EQUALS, val: 'User 1' },
        { field: 'name', op: Operator.EQUALS, val: 'User 2' },
      ],
    },
  })

  assert(result2, false)
})
