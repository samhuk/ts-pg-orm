import { DataFilterLogic, Operator } from '@samhuk/data-filter/dist/types'
import { createMockDbService } from '../../mock/dbService'
import { tsPgOrm } from '../../testData'
import { createQueryPlan } from './queryPlan'

describe('queryPlan', () => {
  describe('createQueryPlan', () => {
    const fn = createQueryPlan

    test('basic test', () => {
      const result = fn(
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

      expect(result).toBeDefined()
    })

    test('execute', async () => {
      const queryPlan = fn(
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
      const db = createMockDbService()
      db.queueResponses([
        [
          {
            '0.uuid': '123',
            '0.title': 'Article 1 by User 1',
            '0.dateCreated': '1970-01-01',
            '0.datePublished': '1970-01-01',
            '0.createdByUserId': 1,
            '1.id': 1,
            '1.name': 'User 1',
            '2.userId': 1,
            '2.streetAddress': '1 Foo Road',
            '2.postCode': 'SE1 9U7',
          },
          {
            '0.uuid': '456',
            '0.title': 'Article 2 by User 2',
            '0.dateCreated': '1970-01-01',
            '0.datePublished': '1970-01-01',
            '0.createdByUserId': 2,
            '1.id': 2,
            '1.name': 'User 2',
            '2.userId': 2,
            '2.streetAddress': '2 Foo Road',
            '2.postCode': 'SE1 9U7',
          },
          {
            '0.uuid': '789',
            '0.title': 'Article 3 by User 3',
            '0.dateCreated': '1970-01-01',
            '0.datePublished': '1970-01-01',
            '0.createdByUserId': 3,
            '1.id': 3,
            '1.name': 'User 3',
            '2.userId': 3,
            '2.streetAddress': '3 Foo Road',
            '2.postCode': 'SE1 9U7',
          },
        ],
        [],
      ])

      const result = await queryPlan.execute(db)

      expect(db.receivedQueries.length).toBe(2)
      expect(db.receivedQueries[0]).toEqual({
        parameters: undefined,
        sql: `select
"0".uuid "0.uuid", "0".title "0.title", "0".date_created "0.dateCreated", "0".date_published "0.datePublished", "0".created_by_user_id "0.createdByUserId", "1".id "1.id", "1".name "1.name", "2".user_id "2.userId", "2".street_address "2.streetAddress", "2".post_code "2.postCode"
from "article" "0"
left join "user" "1" on "1".id = "0".created_by_user_id
left join "user_address" "2" on "2".user_id = "1".id
where "0".date_deleted is null limit 1`,
      })
      expect(db.receivedQueries[1]).toEqual({
        parameters: undefined,
        sql: `select
"3".id "3.id", "3".created_by_user_id "3.createdByUserId", "3".image_id "3.imageId", "3".title "3.title", "4".id "4.id", "4".file_name "4.fileName", "4".created_by_user_id "4.createdByUserId"
from "recipe" "3"
left join "image" "4" on "4".id = "3".image_id
where "3".created_by_user_id in (1, 2, 3)`,
      })

      expect(result).toBeDefined()
    })

    test('modifyRootDataFilter', async () => {
      const queryPlan = fn(
        tsPgOrm.relations,
        tsPgOrm.dataFormats,
        tsPgOrm.dataFormats.article,
        false,
        {
          fields: ['uuid', 'title', 'dateCreated', 'datePublished'],
        },
      )

      const db = createMockDbService()
      db.queueResponse([
        {
          '0.uuid': '123',
          '0.title': 'Article 1 by User 1',
          '0.dateCreated': '1970-01-01',
          '0.datePublished': '1970-01-01',
        },
      ])

      let result = await queryPlan.execute(db)
      expect(db.receivedQueries.length).toBe(1)
      expect(db.receivedQueries[0]).toEqual({
        parameters: undefined,
        sql: `select
"0".uuid "0.uuid", "0".title "0.title", "0".date_created "0.dateCreated", "0".date_published "0.datePublished"
from "article" "0"

limit 1`,
      })
      expect(result).toEqual({
        uuid: '123',
        title: 'Article 1 by User 1',
        dateCreated: '1970-01-01',
        datePublished: '1970-01-01',
      })

      db.clearReceivedQueries()
      db.queueResponse([])
      queryPlan.modifyRootDataFilter({
        field: 'dateDeleted',
        op: Operator.EQUALS,
        val: null,
      })
      result = await queryPlan.execute(db)
      expect(db.receivedQueries.length).toBe(1)
      expect(db.receivedQueries[0]).toEqual({
        parameters: undefined,
        sql: `select
"0".uuid "0.uuid", "0".title "0.title", "0".date_created "0.dateCreated", "0".date_published "0.datePublished"
from "article" "0"

where "0".date_deleted is null limit 1`,
      })
      expect(result).toBeNull()
    })

    test('modifyRootDataQuery', async () => {
      const queryPlan = fn(
        tsPgOrm.relations,
        tsPgOrm.dataFormats,
        tsPgOrm.dataFormats.article,
        true,
        {
          fields: ['uuid', 'title', 'dateCreated', 'datePublished'],
        },
      )

      const db = createMockDbService()
      db.queueResponse([
        {
          '0.uuid': '123',
          '0.title': 'Article 1 by User 1',
          '0.dateCreated': '1970-01-01',
          '0.datePublished': '1970-01-01',
        },
      ])

      let result = await queryPlan.execute(db)
      expect(db.receivedQueries.length).toBe(1)
      expect(db.receivedQueries[0]).toEqual({
        parameters: undefined,
        sql: `select
"0".uuid "0.uuid", "0".title "0.title", "0".date_created "0.dateCreated", "0".date_published "0.datePublished"
from "article" "0"

`,
      })
      expect(result).toEqual([
        {
          uuid: '123',
          title: 'Article 1 by User 1',
          dateCreated: '1970-01-01',
          datePublished: '1970-01-01',
        },
      ])

      db.clearReceivedQueries()
      db.queueResponse([])
      queryPlan.modifyRootDataQuery({
        filter: {
          field: 'dateDeleted',
          op: Operator.EQUALS,
          val: null,
        },
        page: 2,
        pageSize: 50,
      })
      result = await queryPlan.execute(db)
      expect(db.receivedQueries.length).toBe(1)
      expect(db.receivedQueries[0]).toEqual({
        parameters: undefined,
        sql: `select
"0".uuid "0.uuid", "0".title "0.title", "0".date_created "0.dateCreated", "0".date_published "0.datePublished"
from "article" "0"

where "0".date_deleted is null limit 50 offset 50`,
      })
      expect(result).toEqual([])
    })

    test('no fields defined in root node', async () => {
      const queryPlan = fn(
        tsPgOrm.relations,
        tsPgOrm.dataFormats,
        tsPgOrm.dataFormats.article,
        false,
        // "get me the user name of any article"
        {
          fields: [],
          relations: {
            user: {
              fields: ['name'],
            },
          },
        },
      )

      // Narrow down search for an undeleted article with uuid '123'
      queryPlan.modifyRootDataFilter({
        logic: DataFilterLogic.AND,
        nodes: [
          { field: 'dateDeleted', op: Operator.EQUALS, val: null },
          { field: 'uuid', op: Operator.EQUALS, val: '123' },
        ],
      })

      const db = createMockDbService()
      db.queueResponse([
        {
          '0.createdByUserId': 1,
          '1.id': 1,
          '1.name': 'User 1',
        },
      ])

      const result = await queryPlan.execute(db)
      expect(db.receivedQueries.length).toBe(1)
      expect(db.receivedQueries[0]).toEqual({
        parameters: undefined,
        sql: `select
"0".created_by_user_id "0.createdByUserId", "1".name "1.name", "1".id "1.id"
from "article" "0"
left join "user" "1" on "1".id = "0".created_by_user_id
where ("0".date_deleted is null and "0".uuid = '123') limit 1`,
      })
      expect(result).toEqual({
        user: {
          name: 'User 1',
        },
      })
    })
  })
})
