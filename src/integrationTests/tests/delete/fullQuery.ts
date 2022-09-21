import { DataFilterLogic, Operator } from '@samhuk/data-filter/dist/types'
import { test } from '../../common'

export const fullQueryTest = test('full query', async (stores, assert) => {
  const result = await stores.userAddress.delete({
    query: {
      filter: {
        logic: DataFilterLogic.AND,
        nodes: [
          { field: 'city', op: Operator.EQUALS, val: 'London' },
          { field: 'dateDeleted', op: Operator.EQUALS, val: null },
        ],
      },
      page: 1,
      pageSize: 1,
    },
  })

  assert(result, 1)

  const userRecord = await stores.userAddress.get({
    filter: {
      logic: DataFilterLogic.AND,
      nodes: [
        { field: 'city', op: Operator.EQUALS, val: 'London' },
        { field: 'dateDeleted', op: Operator.EQUALS, val: null },
      ],
    },
  })

  assert(userRecord, null)
})
