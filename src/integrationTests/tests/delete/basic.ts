import { DataFilterLogic, Operator } from '@samhuk/data-filter/dist/types'
import { test } from '../../common'

export const basicTest = test('basic', async (stores, assert) => {
  const result = await stores.userAddress.delete({
    query: {
      filter: {
        logic: DataFilterLogic.AND,
        nodes: [
          { field: 'city', op: Operator.EQUALS, val: 'London' },
          { field: 'dateDeleted', op: Operator.EQUALS, val: null },
        ],
      },
    },
  })

  assert(result, 1)

  const userAddressRecord = await stores.userAddress.get({
    filter: {
      logic: DataFilterLogic.AND,
      nodes: [
        { field: 'city', op: Operator.EQUALS, val: 'London' },
        { field: 'dateDeleted', op: Operator.EQUALS, val: null },
      ],
    },
  })

  assert(userAddressRecord, null)
})
