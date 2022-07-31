import { createDbStore } from '.'
import { createMockDbService } from '../mock/dbService'
import { entities } from '../testData'

const a = { foo: 1, bar: 2 }

const b = { foo: 3, bar: 4 }

const c = [a, b]

const d = {
  a: [
    a,
    b,
    {
      a: c,
    },
  ] as const,
}

describe('new', () => {
  describe('createDbStore', () => {
    const fn = createDbStore

    test('test 1', async () => {
      const db = createMockDbService()
      db.queueResponses([
        // The user
        { id: 1, name: 'foo' },
        // The recipes of the user
        [
          { id: 1, created_by_user_id: 1, image_id: 1 },
          { id: 2, created_by_user_id: 1, image_id: 2 },
          { id: 3, created_by_user_id: 1, image_id: 3 },
        ],
        // The image and user of each recipe, interlaced
        { file_name: 'foo' },
        { id: 1, name: 'foo' },
        { file_name: 'bar' },
        { id: 1, name: 'foo' },
        { file_name: 'fizz' },
        { id: 1, name: 'foo' },
      ])
      const store = fn(db, entities, 'user')
      const result = await store.getSingle({
        fields: ['name'],
        relations: {
          recipes: {
            fields: ['id', 'createdByUserId'],
            relations: {
              image: {
                fields: ['fileName'],
              },
              user: { },
            },
          },
        },
      })

      // const result3 = await store.getMultiple({
      //   fields: ['name'],
      //   relations: {
      //     recipes: {
      //       fields: ['id', 'createdByUserId'],
      //       relations: {
      //         image: {
      //           fields: ['fileName'],
      //         },
      //         user: { },
      //       },
      //     },
      //   },
      // })

      // const result2 = await store.updateSingle({
      //   record: {
      //     name: 'new name',
      //   },
      //   filter: {
      //     field: 'id',
      //     op: Operator.EQUALS,
      //     val: 5,
      //   },
      //   return: false,
      // })

      expect(result).toEqual({
        id: 1,
        name: 'foo',
        recipes: [
          {
            id: 1,
            createdByUserId: 1,
            imageId: 1,
            image: { fileName: 'foo' },
            user: { id: 1, name: 'foo' },
          },
          {
            id: 2,
            createdByUserId: 1,
            imageId: 2,
            image: { fileName: 'bar' },
            user: { id: 1, name: 'foo' },
          },
          {
            id: 3,
            createdByUserId: 1,
            imageId: 3,
            image: { fileName: 'fizz' },
            user: { id: 1, name: 'foo' },
          },
        ],
      })
    })
  })
})
