import { Operator } from '@samhuk/data-filter/dist/types'
import { test } from '../../common'

export const basicTest = test('basic', async (orm, assert) => {
  const user3Id = (await orm.stores.user.get({ fields: ['id'], filter: { field: 'name', op: Operator.EQUALS, val: 'User 3' } })).id
  const userGroup1Id = (await orm.stores.userGroup.get({ fields: ['id'], filter: { field: 'name', op: Operator.EQUALS, val: 'User Group 1' } })).id
  const result = await orm.stores.userIdToUserGroupId.create({
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

  const userGroupsOfUser3 = (await orm.stores.user.get({
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
