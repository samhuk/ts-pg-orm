import { Operator } from '@samhuk/data-filter/dist/types'
import { test } from '../../common'

export const basicTest = test('basic get', async (stores, assert) => {
  const result = await stores.user.get({
    fields: ['name', 'email', 'dateCreated'],
    filter: {
      field: 'name', op: Operator.EQUALS, val: 'User 1',
    },
    relations: {
      userAddress: {
        fields: ['city', 'country', 'postCode', 'streetAddress'],
      },
    },
  })

  // TODO: How do we handle dates?
  result.dateCreated = result.dateCreated.toString()

  assert(result, {
    name: 'User 1',
    email: 'user1@email.com',
    dateCreated: result.dateCreated, // TODO: How do we handle dates?
    userAddress: {
      city: 'London',
      country: 'UK',
      postCode: 'SE11 119',
      streetAddress: '1 FooStreet Lane',
    },
  })
})
