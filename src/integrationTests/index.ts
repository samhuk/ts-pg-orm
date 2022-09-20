import { ORM, provisionOrm } from './orm'
import { getTests } from './tests/get'

const init = async () => {
  const stores = await provisionOrm()
  await getTests(stores)
  await ORM.db.client.end()
}

init().then(() => undefined)
