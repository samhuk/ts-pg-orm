import { ORM, provisionOrm } from './orm'
import { deleteTests } from './tests/delete'
import { getTests } from './tests/get'
import { updateTests } from './tests/update'

const init = async () => {
  const stores = await provisionOrm()
  await getTests(stores)
  await updateTests(stores)
  await deleteTests(stores)
  await ORM.db.client.end()
}

init().then(() => undefined)
