import { ORM, provisionOrm } from './orm'
import { getTests } from './tests/get'
import { updateTests } from './tests/update'

const init = async () => {
  const stores = await provisionOrm()
  await getTests(stores)
  await updateTests(stores)
  await ORM.db.client.end()
}

init().then(() => undefined)
