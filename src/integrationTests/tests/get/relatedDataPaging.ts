import { Operator } from '@samhuk/data-filter/dist/types'
import { SortingDirection } from '@samhuk/data-query/dist/sorting/types'
import { test } from '../../common'

export const relatedDataPagingTest = test('related data paging', async (stores, assert) => {
  const result = await stores.user.getMany({
    fields: ['name', 'email'],
    query: {
      filter: {
        field: 'dateDeleted', op: Operator.EQUALS, val: null,
      },
    },
    relations: {
      userGroups: {
        fields: ['name', 'description'],
        query: {
          page: 1,
          pageSize: 2,
          sorting: [{ field: 'dateCreated', dir: SortingDirection.DESC }],
        },
      },
    },
  })

  assert(result, [
    {
      email: 'user1@email.com',
      name: 'User 1',
      userGroups: [
        {
          description: null,
          name: 'User Group 2',
        },
        {
          description: null,
          name: 'User Group 3',
        },
      ],
    },
    {
      email: 'user2@email.com',
      name: 'User 2',
      userGroups: [
        {
          description: null,
          name: 'User Group 2',
        },
      ],
    },
    {
      email: 'user3@email.com',
      name: 'User 3',
      userGroups: [
        {
          description: null,
          name: 'User Group 3',
        },
      ],
    },
  ])
})
