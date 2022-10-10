import { DataFormat, DataFormats } from '.'
import { StringKeysOf, ValuesUnionFromDict } from '../../helpers/types'
import { Fields } from './field'

export type FieldRef<TFieldName extends string = string, TDataFormatName extends string = string> = {
  field: TFieldName
  dataFormat: TDataFormatName
}

export type FieldRefs<TFields extends Fields = Fields, TDataFormatName extends string = string> = {
  [TFieldName in StringKeysOf<TFields>]: FieldRef<TFieldName, TDataFormatName>
}

export type FieldRefsOfDataFormat<TDataFormat extends DataFormat = DataFormat> = FieldRefs<TDataFormat['fields'], TDataFormat['name']>

export type AvailableFieldRefsOfDataFormats<TDataFormats extends DataFormats> = ValuesUnionFromDict<{
  [TDataFormatName in keyof TDataFormats]: ValuesUnionFromDict<TDataFormats[TDataFormatName]['fieldRefs']>
}>
