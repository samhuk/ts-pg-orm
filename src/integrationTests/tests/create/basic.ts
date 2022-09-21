import { DataFilterLogic, Operator } from '@samhuk/data-filter/dist/types'
import { test } from '../../common'

export const basicTest = test('basic', async (stores, assert) => {
  const result = await stores.user.create({
    email: 'newUser@email.com',
    name: 'newUser',
    passwordHash: '123',
  })

  // Ensure consistent values for generated values
  result.id = 1
  result.uuid = '123'
  result.dateCreated = result.dateCreated.toString() // TODO

  assert(result, {
    id: 1,
    uuid: '123',
    dateCreated: result.dateCreated,
    dateDeleted: null,
    name: 'newUser',
    email: 'newUser@email.com',
    passwordHash: '123                                                             ',
  })

  const userRecord = await stores.user.get({
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