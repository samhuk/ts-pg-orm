import { DataFilterLogic, Operator } from '@samhuk/data-filter/dist/types'
import { test } from '../../common'

export const basicTest = test('basic', async (stores, assert) => {
  const result = await stores.user.update({
    record: {
      email: 'user1NewEmail@email.com',
    },
    query: {
      filter: {
        logic: DataFilterLogic.AND,
        nodes: [
          { field: 'name', op: Operator.EQUALS, val: 'User 1' },
          { field: 'dateDeleted', op: Operator.EQUALS, val: null },
        ],
      },
    },
  })

  assert(result, 1)

  const userRecord = await stores.user.get({
    filter: {
      logic: DataFilterLogic.AND,
      nodes: [
        { field: 'name', op: Operator.EQUALS, val: 'User 1' },
        { field: 'dateDeleted', op: Operator.EQUALS, val: null },
      ],
    },
  })

  assert(userRecord.email, 'user1NewEmail@email.com')
})
