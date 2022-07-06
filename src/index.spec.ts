import { createMockDbService } from './mock/dbService'
import { entities } from './testData'

describe('createEntities', () => {
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
      const stores = await entities.sqldb.createAndProvisionStores(db, [
        'user',
        'userGroup',
        'article',
        'recipe',
        'userAddress',
      ])

      // -- Assert
      expect(stores.user).toBeDefined()
      expect(stores.userGroup).toBeDefined()
      expect(stores.article).toBeDefined()
      expect(stores.recipe).toBeDefined()
      expect(stores.userAddress).toBeDefined()

      // -- Act
      const user = await stores.user.getById(1)

      // -- Assert
      expect(user).toEqual({
        id: 1,
        name: 'user 1',
      })
    })
  })
})
