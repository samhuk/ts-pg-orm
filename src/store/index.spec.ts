import { Operator } from '@samhuk/data-filter/dist/types'
import { SortingDirection } from '@samhuk/data-query/dist/sorting/types'
import { createStore } from '.'
import { createMockDbService } from '../mock/dbService'
import { tsPgOrm } from '../testData'

describe('store', () => {
  describe('createStore', () => {
    const fn = createStore

    test('updateSingle', async () => {
      const db = createMockDbService()

      const store = fn(db, tsPgOrm, 'user')

      const result = await store.updateSingle({
        filter: { field: 'id', op: Operator.EQUALS, val: 1 },
        record: {
          id: 3,
          name: 'NEW USER NAME',
        },
      })

      expect(result).toEqual(undefined)
      expect(db.receivedQueries).toEqual([
        {
          parameters: [3, 'NEW USER NAME'],
          sql: 'update "user" set (id, name) = ($1, $2) where id = 1',
        },
      ])
    })

    describe('getSingle', () => {
      test('basic test', async () => {
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

        const store = fn(db, tsPgOrm, 'article')
        const result = await store.getSingle({
          fields: ['uuid', 'title', 'dateCreated', 'datePublished'],
          filter: { field: 'dateDeleted', op: Operator.EQUALS, val: null },
          relations: {
            user: {
              fields: ['name'],
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
        })

        expect(result).toEqual({
          dateCreated: '1970-01-01',
          datePublished: '1970-01-01',
          recipes: [],
          title: 'Article 1 by User 1',
          user: {
            name: 'User 1',
            userAddress: {
              postCode: 'SE1 9U7',
              streetAddress: '1 Foo Road',
              userId: 1,
            },
          },
          uuid: '123',
        })
      })

      test('no relations (performance optimization)', async () => {
        const db = createMockDbService()
        db.queueResponse({
          uuid: '123',
          title: 'Article 1 by User 1',
          date_created: '1970-01-01',
          date_published: '1970-01-01',
        })

        const store = fn(db, tsPgOrm, 'article')
        const result = await store.getSingle({
          fields: ['uuid', 'title', 'dateCreated', 'datePublished'],
          filter: { field: 'dateDeleted', op: Operator.EQUALS, val: null },
        })

        expect(db.receivedQueries.length).toBe(1)
        expect(db.receivedQueries[0]).toEqual({
          parameters: undefined,
          sql: 'select uuid, title, date_created, date_published from "article" where date_deleted is null limit 1',
        })

        expect(result).toEqual({
          dateCreated: '1970-01-01',
          datePublished: '1970-01-01',
          title: 'Article 1 by User 1',
          uuid: '123',
        })
      })
    })

    describe('getMultiple', () => {
      test('no relations (performance optimization)', async () => {
        const db = createMockDbService()
        db.queueResponse([
          {
            uuid: '123',
            title: 'Article 1 by User 1',
            date_created: '1970-01-01',
            date_published: '1970-01-01',
          },
        ])

        const store = fn(db, tsPgOrm, 'article')
        const result = await store.getMultiple({
          fields: ['uuid', 'title', 'dateCreated', 'datePublished'],
          query: {
            filter: { field: 'dateDeleted', op: Operator.EQUALS, val: null },
            page: 2,
            pageSize: 100,
            sorting: [{ field: 'dateCreated', dir: SortingDirection.ASC }],
          },
        })

        expect(db.receivedQueries.length).toBe(1)
        expect(db.receivedQueries[0]).toEqual({
          parameters: undefined,
          // eslint-disable-next-line max-len
          sql: 'select uuid, title, date_created, date_published from "article" where date_deleted is null order by date_created asc limit 100 offset 100',
        })

        expect(result).toEqual([
          {
            dateCreated: '1970-01-01',
            datePublished: '1970-01-01',
            title: 'Article 1 by User 1',
            uuid: '123',
          },
        ])
      })
    })
  })
})
