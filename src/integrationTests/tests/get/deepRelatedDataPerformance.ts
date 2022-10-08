import { DataFilterLogic, Operator } from '@samhuk/data-filter/dist/types'
import { SimplePgClient } from 'simple-pg-client/dist/types'
import { benchmarkAsyncFn, test } from '../../common'
import { generateRandomUserName, USER_ADDRESS_SQL } from './basicPerformance'

const getUserWithAddressWithUserControlFn = async (db: SimplePgClient, userName: string) => {
  const sql = `select
"u1"."id" "u1.id", "u1"."name" "u1.name", "u1"."email" "u1.email",
${USER_ADDRESS_SQL},
"u2"."email" "u2.email", "u2"."name" "u2.name"
from "user" "u1"
left join "user_address" on "user_address"."user_id" = "u1"."id" and "user_address"."date_deleted" is null
left join "user" "u2" on "user_address"."user_id" = "u2"."id" and "u2"."date_deleted" is null
where "u1"."name" = $1 and "u1"."date_deleted" is null`
  const result = await db.query(sql, [userName]) as any
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return {
    id: result['u1.id'],
    name: result['u1.name'],
    email: result['u1.email'],
    userAddress: {
      city: result['user_address.city'],
      country: result['user_address.country'],
      postCode: result['user_address.post_code'],
      streetAddress: result['user_address.street_address'],
      user: {
        name: result['u2.name'],
        email: result['u2.email'],
      },
    },
  }
}

export const deepRelatedDataPerformanceTest = test('deep related data - performance', async (orm, assert) => {
  await benchmarkAsyncFn(async () => {
    const userName = generateRandomUserName()
    await orm.stores.user.get({
      fields: ['name', 'email'],
      filter: {
        logic: DataFilterLogic.AND,
        nodes: [
          { field: 'dateDeleted', op: Operator.EQUALS, val: null },
          { field: 'name', op: Operator.EQUALS, val: userName },
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
  }, async () => {
    const userName = generateRandomUserName()
    const userWithAddressWithUser = await getUserWithAddressWithUserControlFn(orm.db, userName)
    const userId = userWithAddressWithUser.id
    const articlesOfUserSql = 'select "article"."title" from "article" where "article"."creator_user_id" = $1 and "article"."date_deleted" is null'
    const articlesOfUser = await orm.db.queryGetRows(articlesOfUserSql, [userId])

    // eslint-disable-next-line max-len
    const userGroupsOfUserSql = `select "user_group"."name" from "user_to_user_group"
join "user_group" on "user_group"."id" = "user_to_user_group"."user_group_id"
where "user_to_user_group"."user_id" = $1
and "user_group"."date_deleted" is null`
    const userGroupsOfUser = await orm.db.queryGetRows(userGroupsOfUserSql, [userId])
  })
})
