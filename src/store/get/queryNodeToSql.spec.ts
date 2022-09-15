import { Operator } from '@samhuk/data-filter/dist/types'
import { tsPgOrm } from '../../testData'
import { toDataNodes } from './dataNodes'
import { toQueryNodes } from './queryNodes'
import { toSqlNew } from './queryNodeToSql'

describe('queryNodeToSql', () => {
  describe('toSqlNew', () => {
    const fn = toSqlNew

    test('basic test - non-plural, no many-to-manys, no range constraints', () => {
      const dataNodes = toDataNodes(
        tsPgOrm.relations,
        tsPgOrm.dataFormats,
        tsPgOrm.dataFormats.article,
        false,
        {
          fields: ['uuid', 'title', 'dateCreated', 'datePublished'],
          filter: { field: 'dateDeleted', op: Operator.EQUALS, val: null },
          relations: {
            user: {
              relations: {
                userAddress: { },
                recipes: {
                  relations: {
                    image: { },
                  },
                },
              },
            },
          },
        },
      )

      const queryNodes = toQueryNodes(dataNodes)

      const queryNodeList = Object.values(queryNodes)

      const result1 = fn(queryNodeList[0], [1, 2, 3])

      expect(result1).toBe(`select
"0".uuid "0.uuid", "0".title "0.title", "0".date_created "0.dateCreated", "0".date_published "0.datePublished", "0".created_by_user_id "0.createdByUserId",
"1".id "1.id", "1".name "1.name",
"2".user_id "2.userId", "2".street_address "2.streetAddress", "2".post_code "2.postCode"
from "article" "0"
left join "user" "1" on "1".id = "0".created_by_user_id
left join "user_address" "2" on "2".user_id = "1".id
where "0".date_deleted is null
limit 1`)

      const result2 = fn(queryNodeList[1], [1, 2, 3])

      expect(result2).toBe(`select
"3".id "3.id", "3".created_by_user_id "3.createdByUserId", "3".image_id "3.imageId", "3".title "3.title",
"4".id "4.id", "4".file_name "4.fileName", "4".created_by_user_id "4.createdByUserId"
from "recipe" "3"
left join "image" "4" on "4".id = "3".image_id
where "3".created_by_user_id = any (values (1),(2),(3))`)
    })

    test('basic test - non-plural, a many-to-many, range constraints', () => {
      const dataNodes = toDataNodes(
        tsPgOrm.relations,
        tsPgOrm.dataFormats,
        tsPgOrm.dataFormats.article,
        false,
        {
          fields: ['uuid', 'title', 'dateCreated', 'datePublished'],
          filter: { field: 'dateDeleted', op: Operator.EQUALS, val: null },
          relations: {
            user: {
              relations: {
                userAddress: { },
                recipes: {
                  query: {
                    filter: { field: 'imageId', op: Operator.NOT_EQUALS, val: null },
                    page: 1,
                    pageSize: 2,
                  },
                  relations: {
                    image: { },
                  },
                },
                userGroups: {
                  query: {
                    page: 1,
                    pageSize: 5,
                  },
                },
              },
            },
          },
        },
      )

      const queryNodes = toQueryNodes(dataNodes)

      const queryNodeList = Object.values(queryNodes)

      // The root node ()
      const result1 = fn(queryNodeList[0], [])

      expect(result1).toBe(`select
"0".uuid "0.uuid", "0".title "0.title", "0".date_created "0.dateCreated", "0".date_published "0.datePublished", "0".created_by_user_id "0.createdByUserId",
"1".id "1.id", "1".name "1.name",
"2".user_id "2.userId", "2".street_address "2.streetAddress", "2".post_code "2.postCode"
from "article" "0"
left join "user" "1" on "1".id = "0".created_by_user_id
left join "user_address" "2" on "2".user_id = "1".id
where "0".date_deleted is null
limit 1`)

      // The "recipes" node
      const result2 = fn(queryNodeList[1], [1, 2, 3])

      expect(result2).toBe(`select
"3".id "3.id", "3".created_by_user_id "3.createdByUserId", "3".image_id "3.imageId", "3".title "3.title",
"4".id "4.id", "4".file_name "4.fileName", "4".created_by_user_id "4.createdByUserId"
from "user" "_1"
join lateral (
select
"id", "created_by_user_id", "image_id", "title"
from  "recipe" "3"
where "3"."created_by_user_id" = "_1"."id"
and "3".image_id is not null
limit 2 offset 0
) as "3" on "3"."created_by_user_id" = "_1"."id"
left join "image" "4" on "4".id = "3".image_id
where "_1"."id" = any (values (1),(2),(3))`)

      // The "userGroups" node
      const result3 = fn(queryNodeList[2], [1, 2, 3])

      expect(result3).toBe(`select
"5".id "5.id", "5".name "5.name",
"5"."user_to_user_group.user_id" "user_to_user_group.user_id", "5"."user_to_user_group.user_group_id" "user_to_user_group.user_group_id"
from "user" "_1"
join lateral (
select
"5"."id" "id", "5"."name" "name",
"user_to_user_group".user_id "user_to_user_group.user_id", "user_to_user_group".user_group_id "user_to_user_group.user_group_id"
from user_to_user_group "user_to_user_group"
join "user_group" "5" on "5".id = "user_to_user_group"."user_group_id"
where "user_to_user_group"."user_id" = "_1"."id"
limit 5 offset 0
) as "5" on "5"."user_to_user_group.user_id" = "_1"."id"
where "_1"."id" = any (values (1),(2),(3))`)
    })
  })
})
