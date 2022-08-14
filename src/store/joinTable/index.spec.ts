import { createJoinTableStoresDict } from '.'
import { filterForManyToManyRelations } from '../..'
import { createMockDbService } from '../../mock/dbService'
import { tsPgOrm } from '../../testData'

describe('joinTable', () => {
  describe('createLink', () => {
    test('basic test', async () => {
      const db = createMockDbService()
      const manyToManyRelationsList = filterForManyToManyRelations(tsPgOrm.relations)
      const joinStoresDict = createJoinTableStoresDict<
        typeof tsPgOrm['dataFormatDeclarations'],
        typeof tsPgOrm['relationDeclarations']
      >(tsPgOrm.dataFormats, manyToManyRelationsList as any, db)

      db.queueResponse({
        id: 1,
        user_id: 2,
        user_group_id: 3,
      })

      const newJoinTableRecord = await joinStoresDict['user.id <<-->> userGroup.id'].createlink({ userId: 2, userGroupId: 3 })

      expect(newJoinTableRecord).toEqual({
        id: 1,
        userId: 2,
        userGroupId: 3,
      })

      expect(db.receivedQueries.length).toBe(1)
      expect(db.receivedQueries[0]).toEqual({
        parameters: [2, 3],
        sql: `insert into user_to_user_group
set (user_id, user_group_id)
= ($1, $1) returning *`,
      })
    })
  })

  describe('deleteLinkById', () => {
    test('basic test', async () => {
      const db = createMockDbService()
      const manyToManyRelationsList = filterForManyToManyRelations(tsPgOrm.relations)
      const joinStoresDict = createJoinTableStoresDict<
        typeof tsPgOrm['dataFormatDeclarations'],
        typeof tsPgOrm['relationDeclarations']
      >(tsPgOrm.dataFormats, manyToManyRelationsList as any, db)

      db.queueResponse({
        id: 1,
        user_id: 2,
        user_group_id: 3,
      })

      const newJoinTableRecord = await joinStoresDict['user.id <<-->> userGroup.id'].deleteLinkById({ id: 2, return: true })

      expect(newJoinTableRecord).toEqual({
        id: 1,
        userId: 2,
        userGroupId: 3,
      })

      expect(db.receivedQueries.length).toBe(1)
      expect(db.receivedQueries[0]).toEqual({
        parameters: [2],
        sql: 'delete from user_to_user_group where id = $1 returning *',
      })
    })
  })
})
