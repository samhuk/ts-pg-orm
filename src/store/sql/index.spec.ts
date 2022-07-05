import { createEntityDbStore } from '.'
import { createMockDbService } from '../../mock/dbService'
import { entities, entitiesWithNamesProvided } from '../../testData'

describe('createEntityDbStore', () => {
  describe('getting related data', () => {
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

  describe('getting related data - with custom names provided', () => {
    test('user', () => {
      // -- Arrange + Act
      const store = createEntityDbStore({
        db: null,
        dataFormats: entitiesWithNamesProvided.dataFormats,
        relations: entitiesWithNamesProvided.relations,
        dataFormatName: 'user',
      })
      // -- Assert
      expect(store.getRecipes).toBeDefined()
      expect(store.getUserAddress).toBeDefined()
      expect(store.getUserGroups).toBeDefined()
    })

    test('userGroup', () => {
      // -- Arrange + Act
      const store = createEntityDbStore({
        db: null,
        dataFormats: entitiesWithNamesProvided.dataFormats,
        relations: entitiesWithNamesProvided.relations,
        dataFormatName: 'userGroup',
      })
      // -- Assert
      expect(store.getUsers).toBeDefined()
    })

    test('userAddress', () => {
      // -- Arrange + Act
      const store = createEntityDbStore({
        db: null,
        dataFormats: entitiesWithNamesProvided.dataFormats,
        relations: entitiesWithNamesProvided.relations,
        dataFormatName: 'userAddress',
      })
      // -- Assert
      expect(store.getUser).toBeDefined()
    })

    test('recipe', () => {
      // -- Arrange + Act
      const store = createEntityDbStore({
        db: null,
        dataFormats: entitiesWithNamesProvided.dataFormats,
        relations: entitiesWithNamesProvided.relations,
        dataFormatName: 'recipe',
      })
      // -- Assert
      expect(store.getUser).toBeDefined()
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

  test('getWithAllRelations - names provided for related data', async () => {
    // -- Arrange
    const mockDbService = createMockDbService()
    const store = createEntityDbStore({
      db: mockDbService,
      dataFormats: entitiesWithNamesProvided.dataFormats,
      relations: entitiesWithNamesProvided.relations,
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
    expect(user.relatedUserGroups).toEqual([{ id: 1, name: 'foo' }, { id: 2, name: 'bar' }, { id: 3, name: 'foo' }])
    expect(user.relatedUserAddress).toEqual({ userId: 1, streetAddress: 'foo', postCode: 'bar' })
    expect(user.relatedRecipes).toEqual([{ id: 1, createdByUserId: 5 }, { id: 2, createdByUserId: 5 }, { id: 3, createdByUserId: 5 }])
  })

  describe('getByIdWithRelations', () => {
    test('filter for only recipes', async () => {
      // -- Arrange
      const mockDbService = createMockDbService()
      const store = createEntityDbStore({
        db: mockDbService,
        dataFormats: entities.dataFormats,
        relations: entities.relations,
        dataFormatName: 'user',
      })
      mockDbService.queueResponse({ id: 5, name: 'foo' })
      mockDbService.queueResponse([{ id: 1, createdByUserId: 5 }, { id: 2, createdByUserId: 5 }, { id: 3, createdByUserId: 5 }])
      // -- Act
      const user = await store.getByIdWithRelations(5, ['recipes'])
      // -- Assert
      // Assert base record props
      expect(user).toBeDefined()
      expect(user.id).toBe(5)
      expect(user.name).toBe('foo')
      // @ts-expect-error
      expect(user.userGroups).toBeUndefined()
      // @ts-expect-error
      expect(user.userAddress).toBeUndefined()
      expect(user.recipes).toEqual([{ id: 1, createdByUserId: 5 }, { id: 2, createdByUserId: 5 }, { id: 3, createdByUserId: 5 }])
    })

    test('filter for only user address', async () => {
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
      // -- Act
      const user = await store.getByIdWithRelations(5, ['userAddress'])
      // -- Assert
      // Assert base record props
      expect(user).toBeDefined()
      expect(user.id).toBe(5)
      expect(user.name).toBe('foo')
      // @ts-expect-error
      expect(user.userGroups).toBeUndefined()
      expect(user.userAddress).toEqual({ userId: 1, streetAddress: 'foo', postCode: 'bar' })
      // @ts-expect-error
      expect(user.recipes).toBeUndefined()
    })

    test('filter for only user groups', async () => {
      // -- Arrange
      const mockDbService = createMockDbService()
      const store = createEntityDbStore({
        db: mockDbService,
        dataFormats: entities.dataFormats,
        relations: entities.relations,
        dataFormatName: 'user',
      })
      mockDbService.queueResponse({ id: 5, name: 'foo' })
      mockDbService.queueResponse([{ id: 1, name: 'foo' }, { id: 2, name: 'bar' }, { id: 3, name: 'foo' }])
      // -- Act
      const user = await store.getByIdWithRelations(5, ['userGroups'])
      // -- Assert
      // Assert base record props
      expect(user).toBeDefined()
      expect(user.id).toBe(5)
      expect(user.name).toBe('foo')
      expect(user.userGroups).toEqual([{ id: 1, name: 'foo' }, { id: 2, name: 'bar' }, { id: 3, name: 'foo' }])
      // @ts-expect-error
      expect(user.userAddress).toBeUndefined()
      // @ts-expect-error
      expect(user.recipes).toBeUndefined()
    })
  })

  describe('field sub set store functions', () => {
    test('getMetaDataById', async () => {
      // -- Arrange
      const mockDbService = createMockDbService()
      const store = createEntityDbStore({
        db: mockDbService,
        dataFormats: entities.dataFormats,
        relations: entities.relations,
        dataFormatName: 'article',
      })
      mockDbService.queueResponse({ uuid: 'foo', title: 'bar', createdByUserId: 1 })
      // -- Act
      const articleMetaData = await store.getMetaDataById(1)
      // -- Assert
      // Assert record props
      expect(articleMetaData).toBeDefined()
      expect(articleMetaData.uuid).toBe('foo')
      expect(articleMetaData.title).toBe('bar')
      expect(articleMetaData.createdByUserId).toBe(1)
      expect(mockDbService.receivedQueries).toEqual([
        {
          parameters: [1],
          sql: 'select uuid, title, created_by_user_id from "article" where id = $1',
        },
      ])
    })
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
