import { Operator } from '@samhuk/data-filter/dist/types'
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

    test('getSingle', async () => {
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
  })
})
