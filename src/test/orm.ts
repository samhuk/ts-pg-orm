import { createConsoleLogEventHandlers } from 'simple-pg-client'
import {
  createTsPgOrm,
  createDataFormat,
  createCommonFields,
  CreateRecordOptions,
  DataType,
  EpochSubType,
  NumSubType,
  StrSubType,
  ToRecord,
  RelationType,
  ToStores,
  TsPgOrm,
  CreateJoinTableRecordOptions,
} from '..'

const BASE_FIELDS = createCommonFields({
  id: { type: DataType.NUM, subType: NumSubType.SERIAL },
  uuid: { type: DataType.STR, subType: StrSubType.UUID_V4, autoGenerate: true },
  dateCreated: { type: DataType.EPOCH, subType: EpochSubType.DATE_TIME_WITH_TIMEZONE, defaultToCurrentEpoch: true },
  dateDeleted: { type: DataType.EPOCH, subType: EpochSubType.DATE_TIME_WITH_TIMEZONE, allowNull: true, excludeFromCreateOptions: true },
})

const USER_DF = createDataFormat('user', {
  ...BASE_FIELDS,
  name: { type: DataType.STR, subType: StrSubType.VAR_LENGTH, maxLen: 50 },
  email: { type: DataType.STR, subType: StrSubType.VAR_LENGTH, maxLen: 100 },
  passwordHash: { type: DataType.STR, subType: StrSubType.FIXED_LENGTH, len: 64 },
  profileImageId: { type: DataType.NUM, subType: NumSubType.INT, allowNull: true },
})

const ARTICLE_DF = createDataFormat('article', {
  ...BASE_FIELDS,
  title: { type: DataType.STR, subType: StrSubType.VAR_LENGTH, maxLen: 100 },
  creatorUserId: { type: DataType.NUM, subType: NumSubType.INT },
  thumbnailImageId: { type: DataType.NUM, subType: NumSubType.INT },
})

const IMAGE_DF = createDataFormat('image', {
  ...BASE_FIELDS,
  fileName: { type: DataType.STR, subType: StrSubType.VAR_LENGTH, maxLen: 200 },
  creatorUserId: { type: DataType.NUM, subType: NumSubType.INT },
})

const USER_ADDRESS_DF = createDataFormat('userAddress', {
  ...BASE_FIELDS,
  postCode: { type: DataType.STR, subType: StrSubType.VAR_LENGTH, maxLen: 10 },
  streetAddress: { type: DataType.STR, subType: StrSubType.VAR_LENGTH, maxLen: 200 },
  city: { type: DataType.STR, subType: StrSubType.VAR_LENGTH, maxLen: 100 },
  country: { type: DataType.STR, subType: StrSubType.VAR_LENGTH, maxLen: 100 },
  userId: { type: DataType.NUM, subType: NumSubType.INT },
})

const USER_GROUP_DF = createDataFormat('userGroup', {
  ...BASE_FIELDS,
  name: { type: DataType.STR, subType: StrSubType.VAR_LENGTH, maxLen: 100 },
  description: { type: DataType.STR, subType: StrSubType.VAR_LENGTH, maxLen: 300, allowNull: true },
  imageId: { type: DataType.NUM, subType: NumSubType.INT, allowNull: true },
})

export const ORM = createTsPgOrm([USER_DF, IMAGE_DF, ARTICLE_DF, USER_ADDRESS_DF, USER_GROUP_DF] as const, 1)
  .setRelations([
    {
      type: RelationType.ONE_TO_MANY,
      fromOneField: USER_DF.fieldRefs.id,
      toManyField: ARTICLE_DF.fieldRefs.creatorUserId,
    },
    {
      type: RelationType.ONE_TO_MANY,
      fromOneField: IMAGE_DF.fieldRefs.id,
      toManyField: ARTICLE_DF.fieldRefs.thumbnailImageId,
    },
    {
      type: RelationType.ONE_TO_MANY,
      fromOneField: USER_DF.fieldRefs.id,
      toManyField: IMAGE_DF.fieldRefs.creatorUserId,
    },
    {
      type: RelationType.ONE_TO_ONE,
      fromOneField: USER_DF.fieldRefs.id,
      toOneField: USER_ADDRESS_DF.fieldRefs.userId,
    },
    {
      type: RelationType.MANY_TO_MANY,
      fieldRef1: USER_DF.fieldRefs.id,
      fieldRef2: USER_GROUP_DF.fieldRefs.id,
      includeDateCreated: true,
    },
    {
      type: RelationType.ONE_TO_MANY,
      fromOneField: IMAGE_DF.fieldRefs.id,
      toManyField: USER_DF.fieldRefs.profileImageId,
    },
  ] as const)
  .setVersionTransforms({
    2: { sql: 'UPGRADE SQL TO VERSION 2' },
    3: { sql: 'UPGRADE SQL TO VERSION 3' },
  })

export type ConnectedOrm = TsPgOrm<typeof ORM['dataFormats'], typeof ORM['relations'], typeof ORM['versionTransforms'], true>

export type Stores = ToStores<typeof ORM>

export type UserRecord = ToRecord<typeof USER_DF>

export type CreateUserRecordOptions = CreateRecordOptions<typeof USER_DF>

export type CreateImageRecordOptions = CreateRecordOptions<typeof IMAGE_DF>

export type CreateArticleRecordOptions = CreateRecordOptions<typeof ARTICLE_DF>

export type CreateUserAddressRecordOptions = CreateRecordOptions<typeof USER_ADDRESS_DF>

export type CreateUserGroupRecordOptions = CreateRecordOptions<typeof USER_GROUP_DF>

export type CreateUserToUserGroupLinkOptions = CreateJoinTableRecordOptions<
  typeof ORM['dataFormats'],
  // @ts-ignore TODO: This fails on remote with TS error
  typeof ORM['relations']['userIdToUserGroupId']
>

export const provisionOrm = async (): Promise<ConnectedOrm> => {
  const connectedOrm = await ORM.connect({
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432'),
    user: process.env.DATABASE_USER ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? 'postgres',
    db: process.env.DATABASE_NAME ?? 'ts-pg-orm-default',
    createDbIfNotExists: true,
    extensions: ['uuid-ossp'],
    events: {
      ...createConsoleLogEventHandlers(),
      // This can cause a lot of console noise if enabled
      // onQuery: (q, m, sql, p) => console.log(m, p),
      onQueryError: (q, m, sql, p) => console.log(m, '\nSQL:\n', sql, '\nPARAMETERS:\n', p),
    },
  })

  await connectedOrm.unprovisionStores()
  await connectedOrm.provisionStores()

  return connectedOrm
}
