/* eslint-disable quotes */
import { entities } from '../../testData'
import {
  createManyToManyFieldRef1RelationSelectSql,
  createManyToManyFieldRef2RelationSelectSql,
  createOneToManyFromOneRelationSelectSql,
  createOneToManyToManyRelationSelectSql,
  createOneToOneFromOneRelationSelectSql,
  createOneToOneToOneRelationSelectSql,
} from './relationSelectors'

describe('sql', () => {
  test('createOneToOneFromOneRelationSelectSql', () => {
    const fn = createOneToOneFromOneRelationSelectSql

    const sql = fn(entities.dataFormats, entities.relations['user.id <--> userAddress.userId'])

    expect(sql).toBe(`select "user_address".user_id, "user_address".street_address, "user_address".post_code from "user"
join "user_address" on "user_address".user_id = "user".id
where "user".id = $1 limit 1`)
  })

  test('createOneToOneToOneRelationSelectSql', () => {
    const fn = createOneToOneToOneRelationSelectSql

    const sql = fn(entities.dataFormats, entities.relations['user.id <--> userAddress.userId'])

    expect(sql).toBe(`select "user".id, "user".name from "user_address"
join "user" on "user".id = "user_address".user_id
where "user_address".id = $1 limit 1`)
  })

  test('createOneToManyFromOneRelationSelectSql', () => {
    const fn = createOneToManyFromOneRelationSelectSql

    const sql = fn(entities.dataFormats, entities.relations['user.id <-->> recipe.createdByUserId'])

    expect(sql).toBe(`select "recipe".id, "recipe".created_by_user_id from "user"
join "recipe" on "recipe".created_by_user_id = "user".id
where "user".id = $1`)
  })

  test('createOneToManyToManyRelationSelectSql', () => {
    const fn = createOneToManyToManyRelationSelectSql

    const sql = fn(entities.dataFormats, entities.relations['user.id <-->> recipe.createdByUserId'])

    expect(sql).toBe(`select "user".id, "user".name from "recipe"
join "user" on "user".id = "recipe".created_by_user_id
where "recipe".id = $1 limit 1`)
  })

  test('createManyToManyFieldRef1RelationSelectSql', () => {
    const fn = createManyToManyFieldRef1RelationSelectSql

    const sql = fn(entities.dataFormats, entities.relations['user.id <<-->> userGroup.id'])

    expect(sql).toBe(`select "user_group".id, "user_group".name from "user"
join user_to_user_group on user_to_user_group.user_id = "user".id
join "user_group" on "user_group".id = user_to_user_group.user_group_id\nwhere "user".id = $1`)
  })

  test('createManyToManyFieldRef2RelationSelectSql', () => {
    const fn = createManyToManyFieldRef2RelationSelectSql

    const sql = fn(entities.dataFormats, entities.relations['user.id <<-->> userGroup.id'])

    expect(sql).toBe(`select "user".id, "user".name from "user_group"
join user_to_user_group on user_to_user_group.user_group_id = "user_group".id
join "user" on "user".id = user_to_user_group.user_id\nwhere "user_group".id = $1`)
  })
})
