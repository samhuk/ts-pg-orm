import { DataFilterLogic, Operator } from '@samhuk/data-filter/dist/types'
import { test } from '../../common'

export const basicTest = test('basic', async (orm, assert) => {
  const result = await orm.stores.user.create({
    email: 'newUser@email.com',
    name: 'newUser',
    passwordHash: '123',
  })

  // Ensure consistent values for generated values
  result.id = 1
  result.uuid = '123'
  result.dateCreated = null

  assert(result, {
    id: 1,
    uuid: '123',
    dateCreated: null,
    dateDeleted: null,
    name: 'newUser',
    email: 'newUser@email.com',
    passwordHash: '123                                                             ',
  })

  const userRecord = await orm.stores.user.get({
    fields: ['name'],
    filter: {
      logic: DataFilterLogic.AND,
      nodes: [
        { field: 'name', op: Operator.EQUALS, val: 'newUser' },
        { field: 'dateDeleted', op: Operator.EQUALS, val: null },
      ],
    },
  })

  assert(userRecord, { name: 'newUser' })
})
