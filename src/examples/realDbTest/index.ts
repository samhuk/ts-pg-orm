/* eslint-disable no-console */
import { Operator } from '@samhuk/data-filter/dist/types'
import { SortingDirection } from '@samhuk/data-query/dist/sorting/types'
import * as fs from 'fs'
import path from 'path'
import { createConsoleLogEventHandlers } from 'simple-pg-client'
import { addData } from './data'
import { ORM, Stores } from './orm'

const provision = async (): Promise<Stores> => {
  await ORM.initDbClient({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    db: 'ts-pg-orm-test',
    createDbIfNotExists: true,
    extensions: ['uuid-ossp'],
    events: {
      ...createConsoleLogEventHandlers(),
      // TODO: This can cause a lot of console noise if enabled
      onQuery: (q, m, sql, p) => console.log(m, p),
      onQueryError: (q, m, sql, p) => console.log(m),
    },
  })

  const stores = await ORM.createStores({ unprovisionStores: true })

  return stores
}

const getResult = (stores: Stores) => (
  /* E.g.:
   * Get all undeleted users sorted by newest to oldest, and each
   * with all of their uploaded articles and images, and each of those
   * articles with it's image.
   */
  stores.user.getMultiple({
    fields: ['uuid', 'name', 'email', 'dateCreated'],
    query: {
      filter: { field: 'dateDeleted', op: Operator.EQUALS, val: null },
      sorting: [{ field: 'dateCreated', dir: SortingDirection.DESC }],
    },
    relations: {
      articles: {
        fields: ['uuid', 'dateCreated', 'title'],
        relations: {
          image: { fields: ['uuid', 'dateCreated', 'fileName'] },
        },
      },
      images: {
        fields: ['uuid', 'dateCreated', 'fileName'],
      },
    },
  })
)

const timedFn = async <T>(fn: () => Promise<T> | T, taskName: string): Promise<{ dt: number, result: T }> => {
  console.log(`Running ${taskName}...`)
  const start = performance.now()
  let end: number = null
  const result = await fn()
  end = performance.now()
  const dt = end - start
  console.log(`Finished ${taskName}. dt: ${dt.toPrecision(6)} ms`)
  return { dt, result }
}

const repeatTimedFn = async <T>(
  fn: () => Promise<T> | T,
  taskName: string,
  numTimes: number,
  dtList: number[],
  i: number = 0,
): Promise<void> => {
  const result = await timedFn(fn, taskName)
  dtList.push(result.dt)

  if (i < numTimes)
    await repeatTimedFn(fn, taskName, numTimes, dtList, i + 1)
}

const init = async () => {
  const stores = await provision()

  await addData(stores)

  const outputDir = './src/examples/realDbTest/output'
  if (!fs.existsSync(outputDir))
    fs.mkdirSync(outputDir)

  const result1 = await timedFn(() => getResult(stores), 'query')
  fs.writeFileSync(path.resolve(outputDir, 'articles-query.json'), JSON.stringify(result1.result, null, 2))

  // many-to-many
  const result2 = await timedFn(() => stores.user.getMultiple({
    fields: ['name'],
    relations: { userGroups: {} },
  }), 'query')
  fs.writeFileSync(path.resolve(outputDir, 'user-user-groups-query.json'), JSON.stringify(result2.result, null, 2))

  const result3 = await timedFn(() => stores.user.getMultiple({
    fields: ['name'],
    relations: {
      userGroups: {
        query: {
          page: 1,
          pageSize: 1,
        },
      },
    },
  }), 'query')
  fs.writeFileSync(path.resolve(outputDir, 'user-user-groups-query-range-constraint.json'), JSON.stringify(result3.result, null, 2))

  const dtList: number[] = []
  await repeatTimedFn(() => getResult(stores), 'query', 10, dtList)
  const avgDt = dtList.reduce((acc, dt) => acc + dt, 0) / dtList.length

  console.log(`avg dt: ${avgDt.toPrecision(4)} ms`)

  await stores.article.updateSingle({
    record: { title: 'UDPATED TITLE' },
    filter: { field: 'id', op: Operator.EQUALS, val: 1 },
    return: true,
  })

  await stores.article.deleteSingle({
    filter: { field: 'id', op: Operator.EQUALS, val: 1 },
    return: true,
  })

  ORM.db.client.end()
}

init()
