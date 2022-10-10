import { executeTestGroups } from './common'
import { provisionOrm } from '../test/orm'
import { countTests } from './tests/count'
import { createTests } from './tests/create'
import { deleteTests } from './tests/delete'
import { existsTests } from './tests/exists'
import { getPerformanceTests, getTests } from './tests/get'
import { getManyPerformanceTests, getManyTests } from './tests/getMany'
import { joinTableTests } from './tests/joinTable'
import { updateTests } from './tests/update'

const init = async () => {
  const orm = await provisionOrm()
  await executeTestGroups(
    orm,
    getTests,
    getManyTests,
    updateTests,
    deleteTests,
    createTests,
    countTests,
    existsTests,
    joinTableTests,
    // Performance tests last
    getPerformanceTests,
    getManyPerformanceTests,
  )
  await orm.db.client.end()
}

init().then(() => undefined)
