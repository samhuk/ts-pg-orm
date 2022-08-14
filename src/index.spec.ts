import { Operator } from '@samhuk/data-filter/dist/types'
import { createMockDbService } from './mock/dbService'
import { tsPgOrm } from './testData'

describe('createTsPgOrm', () => {
  describe('createStores', () => {
    test('test 1', async () => {
      // -- Arrange
      const db = createMockDbService()
      // Unprovisions for 6 entities and 1 join table
      db.queueResponses([true, true, true, true, true, true, true])
      // Provisions for 6 entities and 1 join table
      db.queueResponses([true, true, true, true, true, true, true])
      // Get user response
      db.queueResponse({
        id: 1,
        name: 'user 1',
      })

      // -- Act
      const stores = await tsPgOrm.createStores({
        db,
        unprovisionStores: true,
      })

      // -- Assert
      expect(stores.user).toBeDefined()
      expect(stores.userGroup).toBeDefined()
      expect(stores.article).toBeDefined()
      expect(stores.recipe).toBeDefined()
      expect(stores.userAddress).toBeDefined()
      expect(stores['user.id <<-->> userGroup.id']).toBeDefined()
      // @ts-expect-error
      expect(stores.notAStore).toBeUndefined()

      // -- Act
      const user = await stores.user.getSingle({ filter: { field: 'id', op: Operator.EQUALS, val: 1 } })

      // -- Assert
      expect(user).toEqual({
        id: 1,
        name: 'user 1',
      })
    })

    test('join table stores', async () => {
      // -- Arrange
      const db = createMockDbService()
      // Unprovisions for 1 join table
      db.queueResponses([true])
      // Provisions for 1 join table
      db.queueResponses([true])
      // Create link response
      db.queueResponse({
        id: 1,
        user_id: 3,
        user_group_id: 2,
      })
      // Delete link by id response
      db.queueResponse({
        id: 1,
        user_id: 3,
        user_group_id: 2,
      })

      const stores = await tsPgOrm.createStores({
        db,
        unprovisionStores: ['user.id <<-->> userGroup.id'],
        provisionStores: ['user.id <<-->> userGroup.id'],
      })

      // -- Act
      const joinTableRecord = await stores['user.id <<-->> userGroup.id'].createlink({ userGroupId: 2, userId: 3 })

      // -- Assert
      expect(joinTableRecord).toEqual({
        id: 1,
        userId: 3,
        userGroupId: 2,
      })

      // -- Act
      const deletedJoinTableRecord = await stores['user.id <<-->> userGroup.id'].deleteLinkById({ id: joinTableRecord.id, return: true })

      // -- Assert
      expect(deletedJoinTableRecord).toEqual({
        id: 1,
        userId: 3,
        userGroupId: 2,
      })
    })
  })
})
