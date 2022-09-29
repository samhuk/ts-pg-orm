import { createTsPgOrm } from '.'
import { createDataFormat } from './dataFormat'
import { CreateRecordOptions } from './dataFormat/types/createRecordOptions'
import { DataType, NumSubType, StrSubType, EpochSubType } from './dataFormat/types/dataType'
import { ToRecord } from './dataFormat/types/record'
import { RelationType } from './relations/types'

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

type UserRecord = ToRecord<typeof USER_DF['fields']>

type CreateUserRecordOptions = CreateRecordOptions<typeof USER_DF['fields']>

const t0 = USER_DF.fieldRefs.dateCreated

const orm = createTsPgOrm([USER_DF, IMAGE_DF, ARTICLE_DF] as const)
  .setRelations([
    {
      type: RelationType.ONE_TO_MANY,
      fromOneField: USER_DF.fieldRefs.id,
      toManyField: IMAGE_DF.fieldRefs.creatorUserId,
    },
  ] as const)

const t1 = orm.relations.userIdToImageCreatorUserId
