import { Operator } from '@samhuk/data-filter/dist/types'
import { test } from '../../common'

export const basicTest = test('basic', async (stores, assert) => {
  const user3Id = (await stores.user.get({ fields: ['id'], filter: { field: 'name', op: Operator.EQUALS, val: 'User 3' } })).id
  const userGroup1Id = (await stores.userGroup.get({ fields: ['id'], filter: { field: 'name', op: Operator.EQUALS, val: 'User Group 1' } })).id
  const result = await stores['user.id <<-->> userGroup.id'].create({
    userId: user3Id,
    userGroupId: userGroup1Id,
  })

  result.id = 1
  result.dateCreated = result.dateCreated.toString()

  assert(result, {
    id: 1,
    userId: user3Id,
    userGroupId: userGroup1Id,
    dateCreated: result.dateCreated,
  })

  const userGroupsOfUser3 = (await stores.user.get({
    fields: [],
    filter: { field: 'name', op: Operator.EQUALS, val: 'User 3' },
    relations: {
      userGroups: {
        fields: ['name'],
      },
    },
  })).userGroups

  assert(userGroupsOfUser3, [
    { name: 'User Group 1' },
    { name: 'User Group 3' },
  ])
})
