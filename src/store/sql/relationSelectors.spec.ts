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

    const sql = fn(entities.dataFormats, entities.relations['e1.a <--> e2.d'])

    expect(sql).toBe(`select * from "e2" where d = $1 limit 1`)
  })

  test('createOneToOneToOneRelationSelectSql', () => {
    const fn = createOneToOneToOneRelationSelectSql

    const sql = fn(entities.dataFormats, entities.relations['e1.a <--> e2.d'])

    expect(sql).toBe(`select * from "e1" where a = $1 limit 1`)
  })

  test('createOneToManyFromOneRelationSelectSql', () => {
    const fn = createOneToManyFromOneRelationSelectSql

    const sql = fn(entities.dataFormats, entities.relations['e1.b <-->> e2.e'])

    expect(sql).toBe(`select * from "e2" where e = $1`)
  })

  test('createOneToManyToManyRelationSelectSql', () => {
    const fn = createOneToManyToManyRelationSelectSql

    const sql = fn(entities.dataFormats, entities.relations['e1.b <-->> e2.e'])

    expect(sql).toBe(`select * from "e1" where b = $1 limit 1`)
  })

  test('createManyToManyFieldRef1RelationSelectSql', () => {
    const fn = createManyToManyFieldRef1RelationSelectSql

    const sql = fn(entities.dataFormats, entities.relations['user.id <<-->> userGroup.id'])

    expect(sql).toBe(`select "user_group".id, "user_group".name from "user"\njoin user_to_user_group on user_to_user_group.user_id = "user".id\njoin "user_group" on "user_group".id = user_to_user_group.user_group_id\nwhere "user".id = $1`)
  })

  test('createManyToManyFieldRef2RelationSelectSql', () => {
    const fn = createManyToManyFieldRef2RelationSelectSql

    const sql = fn(entities.dataFormats, entities.relations['user.id <<-->> userGroup.id'])

    expect(sql).toBe(`select "user".id, "user".name from "user_group"\njoin user_to_user_group on user_to_user_group.user_group_id = "user_group".id\njoin "user" on "user".id = user_to_user_group.user_id\nwhere "user_group".id = $1`)
  })
})
