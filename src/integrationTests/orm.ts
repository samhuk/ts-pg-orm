import { createConsoleLogEventHandlers } from 'simple-pg-client'
import { createTsPgOrm } from '..'
import { createDataFormatDeclaration } from '../dataFormat'
import { BASE_ENTITY_FIELDS, COMMON_FIELDS } from '../dataFormat/common'
import { DataType, StringDataSubType, NumberDataSubType, CreateRecordOptions } from '../dataFormat/types'
import { RelationType } from '../relations/types'
import { _CreateJoinTableRecordOptions } from '../store/joinTable/types'
import { StoresAndJoinTableStoresDict } from '../types'

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

export const ORM = createTsPgOrm()
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
      includeDateCreated: true,
    },
  ] as const)

export type Stores = StoresAndJoinTableStoresDict<typeof ORM['dataFormatDeclarations'], typeof ORM['relationDeclarations']>

export type CreateUserRecordOptions = CreateRecordOptions<typeof USER_DFD>

export type CreateImageRecordOptions = CreateRecordOptions<typeof IMAGE_DFD>

export type CreateArticleRecordOptions = CreateRecordOptions<typeof ARTICLE_DFD>

export type CreateUserAddressRecordOptions = CreateRecordOptions<typeof USER_ADDRESS_DFD>

export type CreateUserGroupRecordOptions = CreateRecordOptions<typeof USER_GROUP_DFD>

export type CreateUserToUserGroupLinkOptions = _CreateJoinTableRecordOptions<
  typeof ORM['dataFormatDeclarations'],
  typeof ORM['relations']['user.id <<-->> userGroup.id']
>

export const provisionOrm = async (): Promise<Stores> => {
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
      // onQuery: (q, m, sql, p) => console.log(m, p),
      onQueryError: (q, m, sql, p) => console.log(m),
    },
  })

  const stores = await ORM.createStores({ unprovisionStores: true })

  return stores
}
