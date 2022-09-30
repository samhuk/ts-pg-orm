import { createTsPgOrm } from '.'
import { createDataFormat } from './dataFormat'
import { CreateRecordOptions } from './dataFormat/types/createRecordOptions'
import { DataType, NumSubType, StrSubType, EpochSubType } from './dataFormat/types/dataType'
import { ToRecord } from './dataFormat/types/record'
import { RelationType } from './relations/types'
import { ExtractManyToManyRelationNames } from './relations/types/relationExtraction'
import { Store } from './store/types'

enum UserType {
  ADMIN,
  CLIENT
}

export const USER_DF = createDataFormat('user', {
  id: { type: DataType.NUM, subType: NumSubType.SERIAL },
  uuid: { type: DataType.STR, subType: StrSubType.UUID_V4, autoGenerate: true },
  name: { type: DataType.STR, subType: StrSubType.VAR_LENGTH, maxLen: 50 },
  email: { type: DataType.STR, subType: StrSubType.VAR_LENGTH, maxLen: 200 },
  type: { type: DataType.NUM, subType: NumSubType.INT_ENUM, default: UserType.ADMIN },
  dateCreated: { type: DataType.EPOCH, subType: EpochSubType.DATE_TIME_WITH_TIMEZONE, defaultToCurrentEpoch: true },
  dateDeleted: { type: DataType.EPOCH, subType: EpochSubType.DATE_TIME_WITH_TIMEZONE, allowNull: true, excludeFromCreateOptions: true },
})

export const IMAGE_DF = createDataFormat('image', {
  id: { type: DataType.NUM, subType: NumSubType.SERIAL },
  uuid: { type: DataType.STR, subType: StrSubType.UUID_V4, autoGenerate: true },
  fileName: { type: DataType.STR, subType: StrSubType.VAR_LENGTH, maxLen: 250 },
  creatorUserId: { type: DataType.NUM, subType: NumSubType.INT, allowNull: true },
  dateCreated: { type: DataType.EPOCH, subType: EpochSubType.DATE_TIME_WITH_TIMEZONE, defaultToCurrentEpoch: true },
  dateDeleted: { type: DataType.EPOCH, subType: EpochSubType.DATE_TIME_WITH_TIMEZONE, allowNull: true, excludeFromCreateOptions: true },
})

export const ARTICLE_DF = createDataFormat('article', {
  id: { type: DataType.NUM, subType: NumSubType.SERIAL },
  uuid: { type: DataType.STR, subType: StrSubType.UUID_V4, autoGenerate: true },
  title: { type: DataType.STR, subType: StrSubType.VAR_LENGTH, maxLen: 250 },
  thumbnailImageId: { type: DataType.NUM, subType: NumSubType.INT, allowNull: true },
  creatorUserId: { type: DataType.NUM, subType: NumSubType.INT, allowNull: true },
  dateCreated: { type: DataType.EPOCH, subType: EpochSubType.DATE_TIME_WITH_TIMEZONE, defaultToCurrentEpoch: true },
  datePublished: { type: DataType.EPOCH, subType: EpochSubType.DATE_TIME_WITH_TIMEZONE, allowNull: true },
  dateDeleted: { type: DataType.EPOCH, subType: EpochSubType.DATE_TIME_WITH_TIMEZONE, allowNull: true, excludeFromCreateOptions: true },
})

export const USER_GROUP_DF = createDataFormat('userGroup', {
  id: { type: DataType.NUM, subType: NumSubType.SERIAL },
  uuid: { type: DataType.STR, subType: StrSubType.UUID_V4, autoGenerate: true },
  name: { type: DataType.STR, subType: StrSubType.VAR_LENGTH, maxLen: 100 },
  thumbnailImageId: { type: DataType.NUM, subType: NumSubType.INT, allowNull: true },
  dateCreated: { type: DataType.EPOCH, subType: EpochSubType.DATE_TIME_WITH_TIMEZONE, defaultToCurrentEpoch: true },
  dateDeleted: { type: DataType.EPOCH, subType: EpochSubType.DATE_TIME_WITH_TIMEZONE, allowNull: true, excludeFromCreateOptions: true },
})

type UserRecord = ToRecord<typeof USER_DF['fields']>

type CreateUserRecordOptions = CreateRecordOptions<typeof USER_DF['fields']>

const t0 = USER_DF.fieldRefs.dateCreated

const orm = createTsPgOrm([USER_DF, IMAGE_DF, ARTICLE_DF, USER_GROUP_DF] as const)
  .setRelations([
    {
      type: RelationType.ONE_TO_MANY,
      fromOneField: USER_DF.fieldRefs.id,
      toManyField: IMAGE_DF.fieldRefs.creatorUserId,
    },
    {
      type: RelationType.ONE_TO_MANY,
      fromOneField: IMAGE_DF.fieldRefs.id,
      toManyField: ARTICLE_DF.fieldRefs.thumbnailImageId,
    },
    {
      type: RelationType.ONE_TO_MANY,
      fromOneField: IMAGE_DF.fieldRefs.id,
      toManyField: USER_GROUP_DF.fieldRefs.thumbnailImageId,
    },
    {
      type: RelationType.MANY_TO_MANY,
      fieldRef1: USER_DF.fieldRefs.id,
      fieldRef2: USER_GROUP_DF.fieldRefs.id,
    },
  ] as const)

const t1 = orm.relations.userIdToImageCreatorUserId

const t2 = orm.relations.userIdToImageCreatorUserId.name

type T0 = ExtractManyToManyRelationNames<typeof orm['relations'], typeof orm['dataFormats']>

type T1 = Store<typeof orm['dataFormats'], typeof orm['relations'], 'user'>

let t3: T1

const result = t3.get({
  fields: ['uuid', 'name', 'email'],
  relations: {
    images: {
      fields: ['uuid', 'fileName', 'dateDeleted'],
      relations: {
        userGroups: {},
      },
    },
    userGroups: {
      fields: ['uuid', 'name'],
      relations: {
        image: { },
      },
    },
  },
})
