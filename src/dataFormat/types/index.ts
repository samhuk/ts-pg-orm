import { StringKeysOf } from '../../helpers/types'
import { FieldsOptions, Fields, FieldList } from './field'
import { FieldRefs } from './fieldRef'
import { FieldSubSets, FieldSubSetsOptions } from './fieldSubSet'
import { DataFormatSql } from './sql'

type _DataFormat<
  TName extends string = string,
  TNamePluralized extends string = `${TName}s`,
  TFieldsOptions extends FieldsOptions = FieldsOptions,
  TFieldNames extends string = string,
  TFieldSubSetsOptions extends FieldSubSetsOptions<TFieldNames> = FieldSubSetsOptions<TFieldNames>,
  TFields extends Fields<TFieldsOptions> = Fields<TFieldsOptions>
> = {
  name: TName
  capitalizedName: Capitalize<TName>
  pluralizedName: TNamePluralized,
  capitalizedPluralizedName: Capitalize<TNamePluralized>
  fields: TFields
  fieldList: FieldList<TFields>
  fieldNameList: TFieldNames[]
  fieldSubSets: FieldSubSets<TFieldNames, TFieldSubSetsOptions>
  fieldRefs: FieldRefs<TFields, TName>
  createRecordFieldNameList: TFieldNames[]
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
  TFieldSubSetsOptions extends FieldSubSetsOptions<StringKeysOf<TFieldsOptions>> = FieldSubSetsOptions<StringKeysOf<TFieldsOptions>>,
> = _DataFormat<TName, TNamePluralized, TFieldsOptions, StringKeysOf<TFieldsOptions>, TFieldSubSetsOptions, Fields<TFieldsOptions>>

export type MutableDataFormatList = DataFormat[]

export type DataFormatList = Readonly<MutableDataFormatList>

export type DataFormats<TDataFormatList extends DataFormatList = DataFormatList> = {
  [K in keyof TDataFormatList & `${bigint}` as TDataFormatList[K] extends { name: infer TName }
    ? TName extends string ? TName : never
    : never
  ]: TDataFormatList[K] extends DataFormat ? TDataFormatList[K] : never
}
