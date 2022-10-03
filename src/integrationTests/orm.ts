import { createConsoleLogEventHandlers } from 'simple-pg-client'
import { createTsPgOrm } from '..'
import { createDataFormat } from '../dataFormat'
import { createCommonFields } from '../dataFormat/field'
import { CreateRecordOptions } from '../dataFormat/types/createRecordOptions'
import { DataType, EpochSubType, NumSubType, StrSubType } from '../dataFormat/types/dataType'
import { ToRecord } from '../dataFormat/types/record'
import { RelationType } from '../relations/types'
import { _CreateJoinTableRecordOptions } from '../store/joinTable/types'
import { StoresAndJoinTableStores } from '../stores/types'

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

export const ORM = createTsPgOrm([USER_DF, IMAGE_DF, ARTICLE_DF, USER_ADDRESS_DF, USER_GROUP_DF] as const)
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
  ] as const)

export type Stores = StoresAndJoinTableStores<typeof ORM['dataFormats'], typeof ORM['relations']>

export type UserRecord = ToRecord<typeof USER_DF>

export type CreateUserRecordOptions = CreateRecordOptions<typeof USER_DF>

export type CreateImageRecordOptions = CreateRecordOptions<typeof IMAGE_DF>

export type CreateArticleRecordOptions = CreateRecordOptions<typeof ARTICLE_DF>

export type CreateUserAddressRecordOptions = CreateRecordOptions<typeof USER_ADDRESS_DF>

export type CreateUserGroupRecordOptions = CreateRecordOptions<typeof USER_GROUP_DF>

export type CreateUserToUserGroupLinkOptions = _CreateJoinTableRecordOptions<
  typeof ORM['dataFormats'],
  // @ts-ignore TODO: This seems to be failing only on remote build
  typeof ORM['relations']['userIdToUserGroupId']
>

export const provisionOrm = async (): Promise<Stores> => {
  await ORM.initDbClient({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    db: process.env.DATABASE_NAME,
    createDbIfNotExists: true,
    extensions: ['uuid-ossp'],
    events: {
      ...createConsoleLogEventHandlers(),
      // This can cause a lot of console noise if enabled
      // onQuery: (q, m, sql, p) => console.log(m, p),
      onQueryError: (q, m, sql, p) => console.log(m),
    },
  })

  await ORM.unprovisionStores()
  await ORM.provisionStores()

  return ORM.stores
}
