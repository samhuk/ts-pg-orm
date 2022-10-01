import { DataType, NumSubType, StrSubType } from './types/dataType'
import { FieldList } from './types/field'

export const filterForCreateRecordField = (fieldList: FieldList) => (
  fieldList.filter(f => !(
    (f.type === DataType.NUM && f.subType === NumSubType.SERIAL)
    || (f.type === DataType.STR && f.subType === StrSubType.UUID_V4 && f.autoGenerate)
    || (f.type === DataType.EPOCH && f.defaultToCurrentEpoch)
  ))
)
