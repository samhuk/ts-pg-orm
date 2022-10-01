import { DataFilterLogic, Operator } from '@samhuk/data-filter/dist/types'
import { test } from '../../common'

export const basicTest = test('basic', async (stores, assert) => {
  const result = await stores.user.getMany({
    fields: ['name', 'email'],
    query: {
      filter: {
        logic: DataFilterLogic.OR,
        nodes: [
          { field: 'name', op: Operator.EQUALS, val: 'User 1' },
          { field: 'name', op: Operator.EQUALS, val: 'User 2' },
        ],
      },
    },
    relations: {
      userAddress: {
        fields: ['city', 'country', 'postCode', 'streetAddress'],
      },
    },
  })

  assert(result, [
    {
      name: 'User 1',
      email: 'user1@email.com',
      userAddress: {
        city: 'London',
        country: 'UK',
        postCode: 'SE11 119',
        streetAddress: '1 FooStreet Lane',
      },
    },
    {
      name: 'User 2',
      email: 'user2@email.com',
      userAddress: {
        city: 'Madrid',
        country: 'Spain',
        postCode: 'SUI SUI',
        streetAddress: '2 FooStreet Lane',
      },
    },
  ])
})
