import { Operator } from '@samhuk/data-filter/dist/types'
import { benchmarkAsyncFn, test } from '../../common'
import { ORM } from '../../orm'

export const basicPerformanceTest = test('basic - performance', async (stores, assert) => {
  await benchmarkAsyncFn(
    // Test fn
    async () => {
      const userNumber = Math.ceil((Math.random() * 3)) // Random number between 1 and 3
      const userName = `User ${userNumber}` // Either "User 1", "User 2", or "User 3"
      await stores.user.get({
        filter: {
          field: 'name', op: Operator.EQUALS, val: userName,
        },
        relations: {
          userAddress: {
            fields: ['city', 'country', 'postCode', 'streetAddress'],
          },
        },
      })
    },
    // Control fn
    async () => {
      const userNumber = Math.ceil((Math.random() * 3)) // Random number between 1 and 3
      const userName = `User ${userNumber}` // Either "User 1", "User 2", or "User 3"
      const sql = `select
"user"."id" "user.id", "user"."uuid" "user.uuid", "user"."name" "user.name", "user"."email" "user.email", "user"."password_hash" "user.password_hash", "user"."date_created" "user.date_created", "user"."date_deleted" "user.date_deleted",
"user_address"."city" "user_address.city", "user_address"."country" "user_address.country", "user_address"."post_code" "user_address.post_code", "user_address"."street_address" "user_address.street_address"
from "user"
left join "user_address" on "user_address".user_id = "user".id
where "user"."name" = $1`
      const result = await ORM.db.query(sql, [userName]) as any
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const obj = {
        id: result['user.id'],
        uuid: result['user.uuid'],
        name: result['user.name'],
        email: result['user.email'],
        passwordHash: result['user.password_hash'],
        dateCreated: result['user.date_created'],
        dateDeleted: result['user.date_deleted'],
        userAddress: {
          city: result['user_address.city'],
          country: result['user_address.country'],
          postCode: result['user_address.post_code'],
          streetAddress: result['user_address.street_address'],
        },
      }
    },
  )
})
