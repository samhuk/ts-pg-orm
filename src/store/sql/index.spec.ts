import { createEntityDbStore } from '.'
import { createMockDbService } from '../../mock/dbService'
import { entities } from '../../testData'

describe('createEntityDbStore', () => {
  describe('relation store properties', () => {
    test('user', () => {
      // -- Arrange + Act
      const store = createEntityDbStore({
        db: null,
        dataFormats: entities.dataFormats,
        relations: entities.relations,
        dataFormatName: 'user',
      })
      // -- Assert
      expect(store.getRecipesOfUser).toBeDefined()
      expect(store.getUserAddressOfUser).toBeDefined()
      expect(store.getUserGroupsOfUser).toBeDefined()
    })

    test('userGroup', () => {
      // -- Arrange + Act
      const store = createEntityDbStore({
        db: null,
        dataFormats: entities.dataFormats,
        relations: entities.relations,
        dataFormatName: 'userGroup',
      })
      // -- Assert
      expect(store.getUsersOfUserGroup).toBeDefined()
    })

    test('userAddress', () => {
      // -- Arrange + Act
      const store = createEntityDbStore({
        db: null,
        dataFormats: entities.dataFormats,
        relations: entities.relations,
        dataFormatName: 'userAddress',
      })
      // -- Assert
      expect(store.getUserOfUserAddress).toBeDefined()
    })

    test('recipe', () => {
      // -- Arrange + Act
      const store = createEntityDbStore({
        db: null,
        dataFormats: entities.dataFormats,
        relations: entities.relations,
        dataFormatName: 'recipe',
      })
      // -- Assert
      expect(store.getUserOfRecipe).toBeDefined()
    })
  })

  test('getWithAllRelations', async () => {
    // -- Arrange
    const mockDbService = createMockDbService()
    const store = createEntityDbStore({
      db: mockDbService,
      dataFormats: entities.dataFormats,
      relations: entities.relations,
      dataFormatName: 'user',
    })
    mockDbService.queueResponse({ id: 5, name: 'foo' })
    mockDbService.queueResponse({ userId: 1, streetAddress: 'foo', postCode: 'bar' })
    mockDbService.queueResponse([{ id: 1, createdByUserId: 5 }, { id: 2, createdByUserId: 5 }, { id: 3, createdByUserId: 5 }])
    mockDbService.queueResponse([{ id: 1, name: 'foo' }, { id: 2, name: 'bar' }, { id: 3, name: 'foo' }])
    // -- Act
    const user = await store.getByIdWithAllRelations(5)
    // -- Assert
    // Assert base record props
    expect(user).toBeDefined()
    expect(user.id).toBe(5)
    expect(user.name).toBe('foo')
    // Assert relations props
    expect(user.userGroups).toEqual([{ id: 1, name: 'foo' }, { id: 2, name: 'bar' }, { id: 3, name: 'foo' }])
    expect(user.userAddress).toEqual({ userId: 1, streetAddress: 'foo', postCode: 'bar' })
    expect(user.recipes).toEqual([{ id: 1, createdByUserId: 5 }, { id: 2, createdByUserId: 5 }, { id: 3, createdByUserId: 5 }])
  })

  test('use of provided db service', async () => {
    // -- Arrange
    const mockDbService = createMockDbService()
    const store = createEntityDbStore({
      db: mockDbService,
      dataFormats: entities.dataFormats,
      relations: entities.relations,
      dataFormatName: 'user',
    })
    mockDbService.queueResponse({ id: 5, name: 'foo' })
    // -- Act
    const user = await store.getById(5)
    // -- Assert
    expect(mockDbService.receivedQueries).toEqual([
      { sql: 'select * from "user" where id = $1 limit 1', parameters: [5] },
    ])
    expect(user).toEqual({ id: 5, name: 'foo' })
  })
})
