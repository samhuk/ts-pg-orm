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

export const basicExcludeFieldsTest = test('basic - excludeFields', async (orm, assert) => {
  const result = await orm.stores.user.get({
    fields: ['name', 'email'],
    excludeFields: true,
    filter: {
      field: 'name', op: Operator.EQUALS, val: 'User 1',
    },
    relations: {
      userAddress: {
        fields: ['city', 'country', 'postCode', 'streetAddress'],
      },
    },
  })

  result.id = 1
  result.dateCreated = null
  result.uuid = '123'

  assert(result, {
    id: 1,
    uuid: '123',
    dateCreated: null,
    dateDeleted: null,
    profileImageId: null,
    passwordHash: '123                                                             ',
    userAddress: {
      city: 'London',
      country: 'UK',
      postCode: 'SE11 119',
      streetAddress: '1 FooStreet Lane',
    },
  })
})

export const basicExcludeFieldsNoRelationsTest = test('basic - excludeFields - no relations', async (orm, assert) => {
  const result = await orm.stores.user.get({
    fields: ['name', 'email'],
    excludeFields: true,
    filter: {
      field: 'name', op: Operator.EQUALS, val: 'User 1',
    },
  })

  result.id = 1
  result.dateCreated = null
  result.uuid = '123'

  assert(result, {
    id: 1,
    uuid: '123',
    dateCreated: null,
    dateDeleted: null,
    profileImageId: null,
    passwordHash: '123                                                             ',
  })
})
