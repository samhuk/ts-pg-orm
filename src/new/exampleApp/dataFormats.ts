import { createDataFormat } from '../../dataFormatNew'
import { BoolType, DataType, DateType, JsonType, NumberType, StringType } from '../../dataFormatNew/field/dataType'
import { ToCreateRecordOptions, ToManualCreateRecordOptions, ToRecord } from '../../dataFormatNew/types'

type UserPreferences = {
  showTips: boolean
}

export const USER_DF = createDataFormat({
  name: 'user',
  fields: {
    id: { type: DataType.NUMBER, subType: NumberType.SERIAL },
    uuid: { type: DataType.STRING, subType: StringType.UUID_V4, autoGenerate: true },
    name: { type: DataType.STRING, subType: StringType.VARYING_LENGTH, maxLength: 50 },
    email: { type: DataType.STRING, subType: StringType.VARYING_LENGTH, maxLength: 200, optional: true },
    emailVerified: { type: DataType.BOOLEAN, subType: BoolType.TRUE_FALSE, default: false },
    dateCreated: { type: DataType.DATE, subType: DateType.DATE_TIME_WITH_TIMEZONE, defaultToCurrentEpoch: true },
    dateDeleted: { type: DataType.DATE, subType: DateType.DATE_TIME_WITH_TIMEZONE, optional: true },
    preferences: { type: DataType.JSON, subType: JsonType.OBJECT, default: null as UserPreferences },
  },
})

type UserDataFormat = typeof USER_DF

type UserRecord = ToRecord<UserDataFormat>
type CreateUserRecordOptions = ToCreateRecordOptions<UserDataFormat>
type ManualCreateUserRecordOptions = ToManualCreateRecordOptions<UserDataFormat>

export const ARTICLE_DF = createDataFormat({
  name: 'article',
  fields: {
    id: { type: DataType.NUMBER, subType: NumberType.SERIAL },
    uuid: { type: DataType.STRING, subType: StringType.UUID_V4, autoGenerate: true },
    title: { type: DataType.STRING, subType: StringType.VARYING_LENGTH, maxLength: 250 },
    creatorUserId: { type: DataType.NUMBER, subType: NumberType.INTEGER },
    dateCreated: { type: DataType.DATE, subType: DateType.DATE_TIME_WITH_TIMEZONE, defaultToCurrentEpoch: true },
    datePublished: { type: DataType.DATE, subType: DateType.DATE_TIME_WITH_TIMEZONE, optional: true },
    dateDeleted: { type: DataType.DATE, subType: DateType.DATE_TIME_WITH_TIMEZONE, optional: true },
  },
})

type ArticleDataFormat = typeof ARTICLE_DF

type ArticleRecord = ToRecord<ArticleDataFormat>
type CreateArticleRecordOptions = ToCreateRecordOptions<ArticleDataFormat>
type ManualCreateArticleRecordOptions = ToManualCreateRecordOptions<ArticleDataFormat>
