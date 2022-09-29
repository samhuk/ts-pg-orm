import { ValuesUnionFromDict } from '../../../helpers/types'
import { FieldsOptions, Fields } from './field'
import { FieldRefs } from './fieldRef'
import { FieldSubSets, FieldSubSetsOptions } from './fieldSubSet'
import { DataFormatSql } from './sql'

type _DataFormat<
  TName extends string = string,
  TNamePluralized extends string = `${TName}s`,
  TFieldsOptions extends FieldsOptions = FieldsOptions,
  TFieldSubSetsOptions extends FieldSubSetsOptions<(keyof TFieldsOptions) & string> = FieldSubSetsOptions<(keyof TFieldsOptions) & string>,
  TFields extends Fields<TFieldsOptions> = Fields<TFieldsOptions>
> = {
  name: TName
  capitalizedName: Capitalize<TName>
  pluralizedName: TNamePluralized,
  capitalizedPluralizedName: Capitalize<TNamePluralized>
  fields: TFields
  fieldList: ValuesUnionFromDict<TFields>[]
  fieldNameList: (keyof TFields)[]
  fieldSubSets: FieldSubSets<(keyof TFieldsOptions) & string, TFieldSubSetsOptions>
  fieldRefs: FieldRefs<TFields, TName>
  createRecordFieldNameList: (keyof TFields)[]
  sql: DataFormatSql<TFields>
  // TODO: Figure out how to nicely do field sub sets, when needed.
  // setFieldSubSets: <TNewFieldSubSetsOptions extends FieldSubSetsOptions<(keyof TFieldsOptions) & string>>(
  //   newFieldSubSetsOptions: TNewFieldSubSetsOptions
  // ) => DataFormat<TName, TFieldsOptions, TNewFieldSubSetsOptions>
}

export type DataFormat<
  TName extends string = string,
  TNamePluralized extends string = `${TName}s`,
  TFieldsOptions extends FieldsOptions = FieldsOptions,
  TFieldSubSetsOptions extends FieldSubSetsOptions<(keyof TFieldsOptions) & string> = FieldSubSetsOptions<(keyof TFieldsOptions) & string>,
> = _DataFormat<TName, TNamePluralized, TFieldsOptions, TFieldSubSetsOptions, Fields<TFieldsOptions>>

export type MutableDataFormatList = DataFormat[]

export type DataFormatList = Readonly<MutableDataFormatList>

export type DataFormats<TDataFormatList extends DataFormatList = DataFormatList> = {
  [K in keyof TDataFormatList & `${bigint}` as TDataFormatList[K] extends { name: infer TName }
    ? `${TName & string}`
    : never
  ]: TDataFormatList[K] extends DataFormat ? TDataFormatList[K] : never
}
