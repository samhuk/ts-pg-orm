import { DataFilterLogic, Operator } from '@samhuk/data-filter/dist/types'
import { test } from '../../common'

export const fullQueryTest = test('full query', async (orm, assert) => {
  const result = await orm.stores.user.update({
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
      page: 1,
      pageSize: 1,
    },
  })

  assert(result, 1)

  const userRecord = await orm.stores.user.get({
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
