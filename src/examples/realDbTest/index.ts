import { Operator } from '@samhuk/data-filter/dist/types'
import { SortingDirection } from '@samhuk/data-query/dist/sorting/types'
import * as fs from 'fs'
import { createConsoleLogEventHandlers } from 'simple-pg-client'
import { createTsPgOrm } from '../..'
import { createDataFormatDeclaration } from '../../dataFormat'
import { BASE_ENTITY_FIELDS, COMMON_FIELDS } from '../../dataFormat/common'
import { StringDataSubType, NumberDataSubType, DataType, CreateRecordOptions } from '../../dataFormat/types'
import { RelationType } from '../../relations/types'
import { StoresDict } from '../../types'

const USER_DFD = createDataFormatDeclaration({
  name: 'user',
  fields: [
    ...BASE_ENTITY_FIELDS,
    COMMON_FIELDS.name50,
    { name: 'email', dataType: DataType.STRING, dataSubType: StringDataSubType.VARYING_LENGTH, maxLength: 100 },
    { name: 'passwordHash', dataType: DataType.STRING, dataSubType: StringDataSubType.FIXED_LENGTH, length: 64 },
  ],
} as const)

const ARTICLE_DFD = createDataFormatDeclaration({
  name: 'article',
  fields: [
    ...BASE_ENTITY_FIELDS,
    { name: 'title', dataType: DataType.STRING, dataSubType: StringDataSubType.VARYING_LENGTH, maxLength: 100 },
    { name: 'creatorUserId', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.INTEGER },
    { name: 'thumbnailImageId', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.INTEGER },
  ],
} as const)

const IMAGE_DFD = createDataFormatDeclaration({
  name: 'image',
  fields: [
    ...BASE_ENTITY_FIELDS,
    { name: 'fileName', dataType: DataType.STRING, dataSubType: StringDataSubType.VARYING_LENGTH, maxLength: 200 },
    { name: 'creatorUserId', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.INTEGER },
  ],
} as const)

const USER_ADDRESS_DFD = createDataFormatDeclaration({
  name: 'userAddress',
  fields: [
    ...BASE_ENTITY_FIELDS,
    { name: 'userId', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.INTEGER },
    { name: 'postCode', dataType: DataType.STRING, dataSubType: StringDataSubType.VARYING_LENGTH, maxLength: 10 },
    { name: 'streetAddress', dataType: DataType.STRING, dataSubType: StringDataSubType.VARYING_LENGTH, maxLength: 200 },
    { name: 'city', dataType: DataType.STRING, dataSubType: StringDataSubType.VARYING_LENGTH, maxLength: 100 },
    { name: 'country', dataType: DataType.STRING, dataSubType: StringDataSubType.VARYING_LENGTH, maxLength: 100 },
  ],
} as const)

const USER_GROUP_DFD = createDataFormatDeclaration({
  name: 'userGroup',
  fields: [
    ...BASE_ENTITY_FIELDS,
    { name: 'name', dataType: DataType.STRING, dataSubType: StringDataSubType.VARYING_LENGTH, maxLength: 100 },
    { name: 'description', dataType: DataType.STRING, dataSubType: StringDataSubType.VARYING_LENGTH, maxLength: 300, allowNull: true },
    { name: 'imageId', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.INTEGER, allowNull: true },
  ],
} as const)

const ORM = createTsPgOrm()
  .loadDataFormats([USER_DFD, IMAGE_DFD, ARTICLE_DFD, USER_ADDRESS_DFD, USER_GROUP_DFD] as const)
  .loadRelations(dfs => [
    {
      type: RelationType.ONE_TO_MANY,
      fromOneField: dfs.user.fieldRefs.id,
      toManyField: dfs.article.fieldRefs.creatorUserId,
    },
    {
      type: RelationType.ONE_TO_MANY,
      fromOneField: dfs.image.fieldRefs.id,
      toManyField: dfs.article.fieldRefs.thumbnailImageId,
    },
    {
      type: RelationType.ONE_TO_MANY,
      fromOneField: dfs.user.fieldRefs.id,
      toManyField: dfs.image.fieldRefs.creatorUserId,
    },
    {
      type: RelationType.ONE_TO_ONE,
      fromOneField: dfs.user.fieldRefs.id,
      toOneField: dfs.userAddress.fieldRefs.userId,
    },
    {
      type: RelationType.MANY_TO_MANY,
      fieldRef1: dfs.user.fieldRefs.id,
      fieldRef2: dfs.userGroup.fieldRefs.id,
    },
  ] as const)

type Stores = StoresDict<typeof ORM['dataFormatDeclarations'], typeof ORM['relationDeclarations']>

type CreateUserRecordOptions = CreateRecordOptions<typeof USER_DFD>

type CreateImageRecordOptions = CreateRecordOptions<typeof IMAGE_DFD>

type CreateArticleRecordOptions = CreateRecordOptions<typeof ARTICLE_DFD>

type CreateUserAddressRecordOptions = CreateRecordOptions<typeof USER_ADDRESS_DFD>

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
      // TODO: These can cause a lot of console noise if enabled
      // onQuery: (q, m, sql, p) => console.log(m, p),
      // onQueryError: (q, m, sql, p) => console.log(m),
    },
  })

  const stores = await ORM.createStores({ unprovisionJoinTables: true, unprovisionStores: true })

  return stores
}

const addData = async (stores: Stores) => {
  // Add users
  const createUserRecordsOptions: CreateUserRecordOptions[] = [
    { name: 'user 1', email: 'user1@email.com', passwordHash: '123' },
    { name: 'user 2', email: 'user2@email.com', passwordHash: '456' },
    { name: 'user 3', email: 'user3@email.com', passwordHash: '789' },
  ]
  await Promise.all(createUserRecordsOptions.map(stores.user.create))

  // Add images
  const createImageRecordsOptions: CreateImageRecordOptions[] = [
    { fileName: 'funnydog.png', creatorUserId: 1 },
    { fileName: 'funnycat.png', creatorUserId: 2 },
    { fileName: 'user3avatar.png', creatorUserId: 3 },
  ]
  await Promise.all(createImageRecordsOptions.map(stores.image.create))

  // Add articles
  const createArticleRecordsOptions: CreateArticleRecordOptions[] = [
    { title: 'Here is a funny dog!', creatorUserId: 3, thumbnailImageId: 1 },
    { title: 'Here is a funny cat!', creatorUserId: 3, thumbnailImageId: 2 },
    { title: 'I am User 3', creatorUserId: 3, thumbnailImageId: 3 },
  ]
  await Promise.all(createArticleRecordsOptions.map(stores.article.create))

  // Add user addresses
  const createUserAddressRecordsOptions: CreateUserAddressRecordOptions[] = [
    { userId: 1, city: 'London', country: 'UK', postCode: 'SE11 119', streetAddress: '5 FooStreet Lane' },
    { userId: 2, city: 'Madrid', country: 'Spain', postCode: 'BON BON', streetAddress: '6 FooStreet Lane' },
    { userId: 3, city: 'Paris', country: 'France', postCode: 'SUI SUI', streetAddress: '7 FooStreet Lane' },
  ]
  await Promise.all(createUserAddressRecordsOptions.map(stores.userAddress.create))
}

const getResult = (stores: Stores) => (
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

  const result = await timedFn(() => getResult(stores), 'query')
  fs.writeFileSync('./OUTPUT.json', JSON.stringify(result.result, null, 2))

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
