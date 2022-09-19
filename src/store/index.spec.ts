import { Operator } from '@samhuk/data-filter/dist/types'
import { SortingDirection } from '@samhuk/data-query/dist/sorting/types'
import { createStore } from '.'
import { createMockDbService } from '../mock/dbService'
import { tsPgOrm } from '../testData'

describe('store', () => {
  describe('createStore', () => {
    const fn = createStore

    describe('get', () => {
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
        const result = await store.get({
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
        const result = await store.get({
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

    describe('getMany', () => {
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
        const result = await store.getMany({
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

    describe('update', () => {
      test('multiple fields, return count, no query', async () => {
        const db = createMockDbService()
        db.queueResponse({ rowCount: 1 })

        const store = fn(db, tsPgOrm, 'user')

        const result = await store.update({
          record: {
            id: 3,
            name: 'NEW USER NAME',
          },
        })

        expect(result).toEqual(1)
        expect(db.receivedQueries).toEqual([
          {
            parameters: [3, 'NEW USER NAME'],
            sql: `update "user" set
(id, name) = ($1, $2)`,
          },
        ])
      })

      test('multiple fields, return count, only where', async () => {
        const db = createMockDbService()
        db.queueResponse({ rowCount: 1 })

        const store = fn(db, tsPgOrm, 'user')

        const result = await store.update({
          query: {
            filter: { field: 'id', op: Operator.EQUALS, val: 1 },
          },
          record: {
            id: 3,
            name: 'NEW USER NAME',
          },
        })

        expect(result).toEqual(1)
        expect(db.receivedQueries).toEqual([
          {
            parameters: [3, 'NEW USER NAME'],
            sql: `update "user" set
(id, name) = ($1, $2)
where id = 1`,
          },
        ])
      })

      test('single field, return first row, full query', async () => {
        const db = createMockDbService()
        db.queueResponse({ rows: [{ id: 1, name: 'NEW USER NAME' }] })

        const store = fn(db, tsPgOrm, 'user')

        const result = await store.update({
          query: {
            filter: { field: 'name', op: Operator.EQUALS, val: 'user1' },
            page: 1,
            pageSize: 10,
          },
          record: {
            name: 'NEW USER NAME',
          },
          return: 'first',
        })

        expect(result).toEqual({ id: 1, name: 'NEW USER NAME' })
        expect(db.receivedQueries).toEqual([
          {
            parameters: ['NEW USER NAME'],
            sql: `update "user" set
name = $1
where ctid in (
select ctid from "user"
where name = 'user1'
limit 10 offset 0
)
returning *`,
          },
        ])
      })
    })

    describe('delete', () => {
      test('multiple fields, return count, no query', async () => {
        const db = createMockDbService()
        db.queueResponse({ rowCount: 1 })

        const store = fn(db, tsPgOrm, 'user')

        const result = await store.delete({ })

        expect(result).toEqual(1)
        expect(db.receivedQueries).toEqual([
          {
            sql: 'delete from "user"',
          },
        ])
      })

      test('multiple fields, return count, only where', async () => {
        const db = createMockDbService()
        db.queueResponse({ rowCount: 1 })

        const store = fn(db, tsPgOrm, 'user')

        const result = await store.delete({
          query: {
            filter: { field: 'id', op: Operator.EQUALS, val: 1 },
          },
        })

        expect(result).toEqual(1)
        expect(db.receivedQueries).toEqual([
          {
            sql: `delete from "user"
where id = 1`,
          },
        ])
      })

      test('single field, return first row, full query', async () => {
        const db = createMockDbService()
        db.queueResponse({ rows: [{ id: 1, name: 'NEW USER NAME' }] })

        const store = fn(db, tsPgOrm, 'user')

        const result = await store.delete({
          query: {
            filter: { field: 'name', op: Operator.EQUALS, val: 'user1' },
            page: 1,
            pageSize: 10,
          },
          return: 'first',
        })

        expect(result).toEqual({ id: 1, name: 'NEW USER NAME' })
        expect(db.receivedQueries).toEqual([
          {
            sql: `delete from "user"
where ctid in (
select ctid from "user"
where name = 'user1'
limit 10 offset 0
)
returning *`,
          },
        ])
      })
    })

    describe('count', () => {
      test('test 1 - no query provided', async () => {
        const db = createMockDbService()
        db.queueResponse({ exact_count: 3 })

        const store = fn(db, tsPgOrm, 'article')
        const result = await store.count()

        expect(db.receivedQueries.length).toBe(1)
        expect(db.receivedQueries[0]).toEqual({
          parameters: undefined,
          sql: `select count(*) as exact_count
from "article"`,
        })

        expect(result).toEqual(3)
      })

      test('test 1 - only where provided', async () => {
        const db = createMockDbService()
        db.queueResponse({ exact_count: 3 })

        const store = fn(db, tsPgOrm, 'article')
        const result = await store.count({
          filter: { field: 'dateDeleted', op: Operator.EQUALS, val: null },
        })

        expect(db.receivedQueries.length).toBe(1)
        expect(db.receivedQueries[0]).toEqual({
          parameters: undefined,
          sql: `select count(*) as exact_count
from "article"
where date_deleted is null`,
        })

        expect(result).toEqual(3)
      })

      test('test 1 - not only where provided', async () => {
        const db = createMockDbService()
        db.queueResponse({ exact_count: 3 })

        const store = fn(db, tsPgOrm, 'article')
        const result = await store.count({
          filter: { field: 'dateDeleted', op: Operator.EQUALS, val: null },
          sorting: [{ field: 'id', dir: SortingDirection.ASC }],
          pageSize: 50,
        })

        expect(db.receivedQueries.length).toBe(1)
        expect(db.receivedQueries[0]).toEqual({
          parameters: undefined,
          sql: `select count(*) as exact_count
from (
select 1 from "article"
where date_deleted is null
order by id asc limit 50 offset 0
) as cte`,
        })

        expect(result).toEqual(3)
      })
    })

    describe('exists', () => {
      test('test 1 - no query provided', async () => {
        const db = createMockDbService()
        db.queueResponse({ exists: true })

        const store = fn(db, tsPgOrm, 'article')
        const result = await store.exists()

        expect(db.receivedQueries.length).toBe(1)
        expect(db.receivedQueries[0]).toEqual({
          parameters: undefined,
          sql: `select exists (
select 1 from "article"
)`,
        })

        expect(result).toEqual(true)
      })

      test('test 1 - only where provided', async () => {
        const db = createMockDbService()
        db.queueResponse({ exists: true })

        const store = fn(db, tsPgOrm, 'article')
        const result = await store.exists({
          filter: { field: 'dateDeleted', op: Operator.EQUALS, val: null },
        })

        expect(db.receivedQueries.length).toBe(1)
        expect(db.receivedQueries[0]).toEqual({
          parameters: undefined,
          sql: `select exists (
select 1 from "article"
where date_deleted is null
)`,
        })

        expect(result).toEqual(true)
      })

      test('test 1 - not only where provided', async () => {
        const db = createMockDbService()
        db.queueResponse({ exists: false })

        const store = fn(db, tsPgOrm, 'article')
        const result = await store.exists({
          filter: { field: 'dateDeleted', op: Operator.EQUALS, val: null },
          sorting: [{ field: 'id', dir: SortingDirection.ASC }],
          pageSize: 50,
        })

        expect(db.receivedQueries.length).toBe(1)
        expect(db.receivedQueries[0]).toEqual({
          parameters: undefined,
          sql: `select exists (
select 1 from "article"
where date_deleted is null
order by id asc limit 50 offset 0
)`,
        })

        expect(result).toEqual(false)
      })
    })
  })
})
