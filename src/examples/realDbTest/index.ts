import * as fs from 'fs'
import { createConsoleLogEventHandlers } from 'simple-pg-client'
import { createTsPgOrm } from '../..'
import { createDataFormatDeclaration } from '../../dataFormat'
import { BASE_ENTITY_FIELDS, COMMON_FIELDS } from '../../dataFormat/common'
import { StringDataSubType, NumberDataSubType, DataType, ToRecord, CreateRecordOptions } from '../../dataFormat/types'
import { RelationType } from '../../relations/types'
import { createQueryPlan } from '../../store/get/queryPlan'
import { QueryPlan } from '../../store/get/types'
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
  .loadDataFormats([USER_DFD, ARTICLE_DFD, IMAGE_DFD, USER_ADDRESS_DFD, USER_GROUP_DFD] as const)
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

  await ORM.sql.dropJoinTables()

  const stores = await ORM.sql.createStores({
    provisionOrder: ['user', 'image', 'article', 'userAddress', 'userGroup'],
    unprovisionStores: true,
  })

  await ORM.sql.createJoinTables()

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

const getResultV3 = (stores: Stores) => (
  stores.user.getMultiple({
    fields: ['uuid', 'name', 'email', 'dateCreated'],
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

const createGetResultV4QueryPlan = () => createQueryPlan(
  ORM.relations,
  ORM.dataFormats,
  ORM.dataFormats.user,
  true,
  {
    fields: ['uuid', 'name', 'email', 'dateCreated'],
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
  },
)

const getResultV4 = <T extends QueryPlan>(queryPlan: T) => queryPlan.execute(ORM.db)

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

const init = async () => {
  const stores = await provision()

  await addData(stores)

  const resultV3 = await timedFn(() => getResultV3(stores), 'V3 query')
  fs.writeFileSync('./OUTPUT.json', JSON.stringify(resultV3.result, null, 2))

  const queryPlanTimedFnResult = await timedFn(() => createGetResultV4QueryPlan(), 'V4 query plan creation')

  const resultV4 = await timedFn(() => getResultV4(queryPlanTimedFnResult.result), 'V4 query plan execution')
  fs.writeFileSync('./OUTPUT.json', JSON.stringify(resultV4.result, null, 2))

  const v4TotalDt = queryPlanTimedFnResult.dt + resultV4.dt

  console.log(`v4 query plan creation dt as part of total dt: ${((queryPlanTimedFnResult.dt / v4TotalDt) * 100).toPrecision(2)}%`)

  console.log(`v3 to v4 speed increase: ${(((resultV3.dt - v4TotalDt) / resultV3.dt) * 100).toPrecision(2)}%`)

  ORM.db.client.end()
}

init()
