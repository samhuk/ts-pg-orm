import { DataFilterLogic, Operator } from '@samhuk/data-filter/dist/types'
import { test } from '../../common'

export const deepRelatedDataTest = test('deep related data', async (stores, assert) => {
  const result = await stores.user.get({
    fields: ['name', 'email'],
    filter: {
      logic: DataFilterLogic.AND,
      nodes: [
        { field: 'dateDeleted', op: Operator.EQUALS, val: null },
        { field: 'name', op: Operator.EQUALS, val: 'User 1' },
      ],
    },
    relations: {
      userAddress: {
        fields: ['city', 'country', 'postCode', 'streetAddress'],
        query: {
          filter: { field: 'dateDeleted', op: Operator.EQUALS, val: null },
        },
        relations: {
          user: {
            fields: ['email', 'name'],
            query: {
              filter: { field: 'dateDeleted', op: Operator.EQUALS, val: null },
            },
            relations: {
              articles: {
                fields: ['title'],
                query: {
                  filter: { field: 'dateDeleted', op: Operator.EQUALS, val: null },
                },
              },
              userGroups: {
                fields: ['name'],
                query: {
                  filter: { field: 'dateDeleted', op: Operator.EQUALS, val: null },
                  pageSize: 2,
                },
              },
            },
          },
        },
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
      user: {
        email: 'user1@email.com',
        name: 'User 1',
        articles: [
          { title: 'I am User 1' },
        ],
        userGroups: [
          { name: 'User Group 1' },
          { name: 'User Group 2' },
        ],
      },
    },
  })
})
