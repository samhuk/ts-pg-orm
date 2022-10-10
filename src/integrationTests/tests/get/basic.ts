import { Operator } from '@samhuk/data-filter/dist/types'
import { test } from '../../common'

export const basicTest = test('basic', async (orm, assert) => {
  const result = await orm.stores.user.get({
    fields: ['name', 'email'],
    filter: {
      field: 'name', op: Operator.EQUALS, val: 'User 1',
    },
    relations: {
      userAddress: {
        fields: ['city', 'country', 'postCode', 'streetAddress'],
      },
    },
  })

  const result2 = await orm.stores.article.get({
    fields: ['id', 'uuid'],
    relations: {
      image: {
        fields: ['id', 'fileName'],
      },
    },
  })

  assert(result, {
    name: 'User 1',
    email: 'user1@email.com',
    userAddress: {
      city: 'London',
      country: 'UK',
      postCode: 'SE11 119',
      streetAddress: '1 FooStreet Lane',
    },
  })
})
