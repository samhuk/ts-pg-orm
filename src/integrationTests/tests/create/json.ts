import { DataFilterLogic, Operator } from '@samhuk/data-filter/dist/types'
import { test } from '../../common'

export const jsonTest = test('json', async (orm, assert) => {
  const user = await orm.stores.user.create({
    email: 'newUser@email.com',
    name: 'newUser',
    passwordHash: '123',
  })

  const userPrefs = await orm.stores.userPreferences.create({
    userId: user.id,
    preferences: { darkMode: true, showHelp: false },
    array: [{ a: 1, b: 2 }, { a: 3, b: 4 }],
  })

  // Ensure consistent values for generated values
  userPrefs.id = 1
  userPrefs.uuid = '123'
  userPrefs.dateCreated = null

  assert(userPrefs, {
    id: 1,
    uuid: '123',
    dateCreated: null,
    dateDeleted: null,
    userId: user.id,
    preferences: { darkMode: true, showHelp: false },
    array: [{ a: 1, b: 2 }, { a: 3, b: 4 }],
  })

  const foundUserPrefsRecord = await orm.stores.userPreferences.get({
    fields: ['preferences', 'array'],
    filter: {
      logic: DataFilterLogic.AND,
      nodes: [
        { field: 'userId', op: Operator.EQUALS, val: user.id },
        { field: 'dateDeleted', op: Operator.EQUALS, val: null },
      ],
    },
  })

  assert(foundUserPrefsRecord, {
    preferences: { darkMode: true, showHelp: false },
    array: [{ a: 1, b: 2 }, { a: 3, b: 4 }],
  })
})
