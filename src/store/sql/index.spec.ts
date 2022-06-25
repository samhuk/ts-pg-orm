import { createEntityDbStore } from '.'
import { entities } from '../../testData'

describe('createEntityDbStore', () => {
  test('e1', () => {
    const store = createEntityDbStore({
      db: null,
      dataFormats: entities.dataFormats,
      relations: entities.relations,
      dataFormatName: 'e1',
    })
    expect(store.getRelatedE2RecordOnD).toBeDefined()
    expect(store.getRelatedE2RecordsOnE).toBeDefined()
    expect(store.getRelatedE2RecordsOnF).toBeDefined()
  })

  test('e2', () => {
    const store = createEntityDbStore({
      db: null,
      dataFormats: entities.dataFormats,
      relations: entities.relations,
      dataFormatName: 'e2',
    })
    expect(store.getRelatedE1RecordOnA).toBeDefined()
    expect(store.getRelatedE1RecordOnB).toBeDefined()
    expect(store.getRelatedE1RecordsOnC).toBeDefined()
  })

  test('user', () => {
    const store = createEntityDbStore({
      db: null,
      dataFormats: entities.dataFormats,
      relations: entities.relations,
      dataFormatName: 'user',
    })
    expect(Object.keys(store)).toContain('getUserGroupsOfUser')
  })

  test('userGroup', () => {
    const store = createEntityDbStore({
      db: null,
      dataFormats: entities.dataFormats,
      relations: entities.relations,
      dataFormatName: 'userGroup',
    })
    expect(Object.keys(store)).toContain('getUsersOfUserGroup')
  })
})
