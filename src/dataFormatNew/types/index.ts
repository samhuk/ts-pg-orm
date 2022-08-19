import { DefaultPluralize, ExpandOneLevel, NamedItemListToDict } from '../../helpers/types'
import { FieldOptionsDict, Fields } from '../field/types'
import { FieldsToCreateRecordOptions, FieldsToManualCreateRecordOptions } from './createRecord'
import { FieldRefs } from './fieldRef'
import { FieldsToRecord } from './record'

export type DataFormatOptions<
    TName extends string = string,
    TFields extends FieldOptionsDict = FieldOptionsDict,
> = {
    name: TName
    pluralizedName?: string
    tableName?: string
    fields: TFields
    validations?: (keyof TFields)[] // TODO: Implement proper types for this
}

type _DataFormat<
  TName extends string = string,
  TFields extends Fields = Fields,
  TOptions extends DataFormatOptions = DataFormatOptions,
  TFieldNames extends keyof TOptions['fields'] = keyof TOptions['fields'],
  TFieldValidations extends (keyof TOptions['fields'])[] = (keyof TOptions['fields'])[]
> = {
  name: TName
  capitalizedName: Capitalize<TName>
  pluralizedName: TOptions extends { pluralizedName: string }
    ? TOptions['pluralizedName']
    : DefaultPluralize<TName>
  capitalizedPluralizedName: Capitalize<DefaultPluralize<TName>>
  fields: TFields
  fieldNameList: TFieldNames
  fieldRefs: FieldRefs<TOptions>
  colNames: { [k in TFieldNames]: string }
  createRecordFieldNameList: keyof FieldsToCreateRecordOptions<TFields>
  colNameList: string[]
  tableName: TOptions extends { tableName: string } ? TOptions['tableName'] : string
  createCreateTableSql: () => string
  dropTableSql: string
  validations: TFieldValidations
  colNameToFieldName: { [colName: string]: TFieldNames }
  defineValidations: <TNewFieldValidations extends (TFieldNames)[]>(
    validations: TNewFieldValidations,
  ) => _DataFormat<TName, TFields, TOptions, TFieldNames, TNewFieldValidations>
  sqlRowToRecord: <TFields2 extends TFields = TFields>(
    row: { [colName: string]: any }
  ) => FieldsToRecord<TFields2>
}

export type DataFormat<
  TOptions extends DataFormatOptions = DataFormatOptions,
  // TODO: Demo
  TFieldValidations extends (keyof TOptions['fields'])[] = (keyof TOptions['fields'])[]
> = _DataFormat<
  TOptions['name'],
  Fields<TOptions['fields']>,
  TOptions,
  keyof TOptions['fields'],
  TFieldValidations
>

export type DataFormatList = Readonly<DataFormat[]>

export type DataFormatsFromOptions<
  TDataFormatList extends DataFormatList = DataFormatList
> = NamedItemListToDict<TDataFormatList>

export type DataFormats = {
  [dataFormatName: string]: DataFormat
}

/**
 * Converts the given data format type into it's record type.
 */
export type ToRecord<T extends DataFormat> = FieldsToRecord<T['fields']>

/**
 * Converts the given data format type into it's create record options type.
 */
export type ToCreateRecordOptions<T extends DataFormat> = ExpandOneLevel<FieldsToCreateRecordOptions<T['fields']>>

/**
 * Converts the given data format type into it's manual create record options type.
 */
export type ToManualCreateRecordOptions<T extends DataFormat> = ExpandOneLevel<FieldsToManualCreateRecordOptions<T['fields']>>
