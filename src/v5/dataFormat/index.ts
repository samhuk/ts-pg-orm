import { DataFormat } from './types'
import { CreateRecordOptions } from './types/createRecordOptions'
import { DataType, EpochSubType, NumSubType, StrSubType } from './types/dataType'
import { FieldsOptions } from './types/field'
import { FieldSubSetsOptions } from './types/fieldSubSet'
import { ToRecord } from './types/record'

const createDataFormat = <TName extends string>(
  name: TName,
): DataFormat<TName, FieldsOptions, FieldSubSetsOptions<(keyof FieldsOptions) & string>> => {
  return {
    name,
    fields: {},
    fieldList: [],
    fieldNameList: [],
    fieldSubSets: {},
    setFields: newFieldsOptions => undefined as any,
  }
}

enum UserType {
  ADMIN,
  CLIENT
}

const USER_DF = createDataFormat('user').setFields({
  id: { type: DataType.NUM, subType: NumSubType.SERIAL },
  uuid: { type: DataType.STR, subType: StrSubType.UUID_V4, autoGenerate: true },
  name: { type: DataType.STR, subType: StrSubType.VAR_LENGTH, maxLen: 50 },
  email: { type: DataType.STR, subType: StrSubType.VAR_LENGTH, maxLen: 200 },
  profileImageId: { type: DataType.NUM, subType: NumSubType.INT, allowNull: true },
  type: { type: DataType.NUM, subType: NumSubType.INT_ENUM, default: UserType.ADMIN },
  dateCreated: { type: DataType.EPOCH, subType: EpochSubType.DATE_TIME_WITH_TIMEZONE, defaultToCurrentEpoch: true },
  dateDeleted: { type: DataType.EPOCH, subType: EpochSubType.DATE_TIME_WITH_TIMEZONE, allowNull: true, excludeFromCreateOptions: true },
})

type UserRecord = ToRecord<typeof USER_DF>

type CreateUserRecordOptions = CreateRecordOptions<typeof USER_DF>
