import { Operator } from '@samhuk/data-filter/dist/types'
import { createMockDbService } from './mock/dbService'
import { tsPgOrm } from './testData'

describe('createTsPgOrm', () => {
  describe('createStores', () => {
    test('test 1', async () => {
      // -- Arrange
      const db = createMockDbService()
      // Unprovisions for 5 entities
      db.queueResponses([true, true, true, true, true])
      // Provisions for 5 entities
      db.queueResponses([true, true, true, true, true])
      // Get user response
      db.queueResponse({
        id: 1,
        name: 'user 1',
      })

      // -- Act
      const stores = await tsPgOrm.sql.createStores({
        db,
        provisionOrder: [
          'user',
          'userGroup',
          'article',
          'recipe',
          'userAddress',
        ],
        unprovisionStores: true,
      })

      // -- Assert
      expect(stores.user).toBeDefined()
      expect(stores.userGroup).toBeDefined()
      expect(stores.article).toBeDefined()
      expect(stores.recipe).toBeDefined()
      expect(stores.userAddress).toBeDefined()

      // -- Act
      const user = await stores.user.getSingle({ filter: { field: 'id', op: Operator.EQUALS, val: 1 } })

      // -- Assert
      expect(user).toEqual({
        id: 1,
        name: 'user 1',
      })
    })
  })
})
