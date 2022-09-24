/* eslint-disable max-len */
import { Operator } from '@samhuk/data-filter/dist/types'
import { benchmarkAsyncFn, test } from '../../common'
import { ORM } from '../../orm'

export const generateRandomUserName = () => {
  const userNumber = Math.ceil((Math.random() * 3)) // Random number between 1 and 3
  return `User ${userNumber}` // Either "User 1", "User 2", or "User 3"
}

const USER_COLUMNS_SQL = '"user"."id" "user.id", "user"."uuid" "user.uuid", "user"."name" "user.name", "user"."email" "user.email", "user"."password_hash" "user.password_hash", "user"."date_created" "user.date_created", "user"."date_deleted" "user.date_deleted",'
export const USER_ADDRESS_SQL = '"user_address"."city" "user_address.city", "user_address"."country" "user_address.country", "user_address"."post_code" "user_address.post_code", "user_address"."street_address" "user_address.street_address"'

const getUserWithUserAddressControlFn = async (userName: string) => {
  const sql = `select
${USER_COLUMNS_SQL}
${USER_ADDRESS_SQL}
from "user"
left join "user_address" on "user_address"."user_id" = "user".id
where "user"."name" = $1`
  const result = await ORM.db.query(sql, [userName]) as any
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return {
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
}

export const basicPerformanceTest = test('basic - performance', async (stores, assert) => {
  await benchmarkAsyncFn(async () => {
    const userName = generateRandomUserName()
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
  }, async () => {
    const userName = generateRandomUserName()
    await getUserWithUserAddressControlFn(userName)
  })
})
