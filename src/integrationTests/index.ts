import { executeTestGroups } from './common'
import { ORM, provisionOrm } from './orm'
import { countTests } from './tests/count'
import { createTests } from './tests/create'
import { deleteTests } from './tests/delete'
import { existsTests } from './tests/exists'
import { getTests } from './tests/get'
import { joinTableTests } from './tests/joinTable'
import { updateTests } from './tests/update'

const init = async () => {
  const stores = await provisionOrm()
  await executeTestGroups(
    stores,
    getTests,
    updateTests,
    deleteTests,
    createTests,
    countTests,
    existsTests,
    joinTableTests,
  )
  await ORM.db.client.end()
}

init().then(() => undefined)
