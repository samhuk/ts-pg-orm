import { createEntityDbStore } from '.'
import { entities } from '../../testData'
import { DbService } from '../../types'

type MockDbService = DbService & {
  queuedResponses: any[]
  queueResponse: (response: any) => void
  receivedQueries: { sql: string, parameters?: any[] }[]
  clearReceivedQueries: () => void
}

const createMockDbService = (): MockDbService => {
  let instance: MockDbService
  let i = -1

  const sendResponse = (sql: string, parameters: string[]) => {
    // eslint-disable-next-line no-multi-assign
    const j = i += 1
    instance.receivedQueries.push({ sql, parameters })
    return Promise.resolve(instance.queuedResponses[j])
  }

  return instance = {
    queuedResponses: [],
    queueResponse: response => instance.queuedResponses.push(response),

    receivedQueries: [],
    clearReceivedQueries: () => instance.receivedQueries = [],

    query: sendResponse,
    queryGetRows: sendResponse,
    queryGetFirstRow: sendResponse,
  }
}

describe('createEntityDbStore', () => {
  describe('relation store properties', () => {
    test('user', () => {
      const store = createEntityDbStore({
        db: null,
        dataFormats: entities.dataFormats,
        relations: entities.relations,
        dataFormatName: 'user',
      })
      expect(store.getRecipesOfUser).toBeDefined()
      expect(store.getUserAddressOfUser).toBeDefined()
      expect(store.getUserGroupsOfUser).toBeDefined()
    })

    test('userGroup', () => {
      const store = createEntityDbStore({
        db: null,
        dataFormats: entities.dataFormats,
        relations: entities.relations,
        dataFormatName: 'userGroup',
      })
      expect(store.getUsersOfUserGroup).toBeDefined()
    })

    test('userAddress', () => {
      const store = createEntityDbStore({
        db: null,
        dataFormats: entities.dataFormats,
        relations: entities.relations,
        dataFormatName: 'userAddress',
      })
      expect(store.getUserOfUserAddress).toBeDefined()
    })

    test('recipe', () => {
      const store = createEntityDbStore({
        db: null,
        dataFormats: entities.dataFormats,
        relations: entities.relations,
        dataFormatName: 'recipe',
      })
      expect(store.getUserOfRecipe).toBeDefined()
    })
  })

  test('getWithAllRelationsTest', async () => {
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
    const user = await store.getByIdWithAllRelations(5)
    expect(user).toBeDefined()
    expect(user.id).toBe(5)
    expect(user.name).toBe('foo')
    expect(user.userGroups).toEqual([{ id: 1, name: 'foo' }, { id: 2, name: 'bar' }, { id: 3, name: 'foo' }])
    expect(user.userAddress).toEqual({ userId: 1, streetAddress: 'foo', postCode: 'bar' })
    expect(user.recipes).toEqual([{ id: 1, createdByUserId: 5 }, { id: 2, createdByUserId: 5 }, { id: 3, createdByUserId: 5 }])
  })

  test('use of provided db service', async () => {
    const mockDbService = createMockDbService()
    const store = createEntityDbStore({
      db: mockDbService,
      dataFormats: entities.dataFormats,
      relations: entities.relations,
      dataFormatName: 'user',
    })
    mockDbService.queueResponse({ id: 5, name: 'foo' })
    const user = await store.getById(5)
    expect(mockDbService.receivedQueries).toEqual([
      { sql: 'select * from "user" where id = $1 limit 1', parameters: [5] },
    ])
    expect(user).toEqual({ id: 5, name: 'foo' })
  })
})
