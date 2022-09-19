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
  stores.user.getMany({
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
  const result2 = await timedFn(() => stores.user.getMany({
    fields: ['name'],
    relations: { userGroups: {} },
  }), 'query')
  fs.writeFileSync(path.resolve(outputDir, 'user-user-groups-query.json'), JSON.stringify(result2.result, null, 2))

  const result3 = await timedFn(() => stores.user.getMany({
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

  const numArticlesUpdated = await stores.article.update({
    record: { title: 'UPDATED TITLE' },
    query: {
      filter: { field: 'id', op: Operator.EQUALS, val: 1 },
    },
  })
  console.log('num articles updated: ', numArticlesUpdated)

  const articlesUpdated = await stores.article.update({
    record: { title: 'UPDATED TITLE' },
    query: {
      filter: { field: 'id', op: Operator.EQUALS, val: 1 },
    },
    return: true,
  })
  console.log('articles updated: ', articlesUpdated)

  const articleUpdated = await stores.article.update({
    record: { title: 'UPDATED TITLE', creatorUserId: 1 },
    query: {
      filter: { field: 'id', op: Operator.EQUALS, val: 1 },
      page: 1,
      pageSize: 1,
    },
    return: 'first',
  })
  console.log('article updated: ', articleUpdated)

  let exists = await stores.article.exists()
  console.log('Exists 1: ', exists)
  exists = await stores.article.exists({
    filter: { field: 'dateDeleted', op: Operator.EQUALS, val: null },
  })
  console.log('Exists 2: ', exists)
  exists = await stores.article.exists({
    filter: { field: 'dateDeleted', op: Operator.EQUALS, val: null },
    sorting: [{ field: 'id', dir: SortingDirection.ASC }],
  })
  console.log('Exists 3: ', exists)

  let count = await stores.article.count()
  console.log('Count 1: ', count)
  count = await stores.article.count({
    filter: { field: 'dateDeleted', op: Operator.EQUALS, val: null },
  })
  console.log('Count 2: ', count)
  count = await stores.article.count({
    filter: { field: 'dateDeleted', op: Operator.EQUALS, val: null },
    sorting: [{ field: 'id', dir: SortingDirection.ASC }],
  })
  console.log('Count 3: ', count)

  ORM.db.client.end()
}

init()
