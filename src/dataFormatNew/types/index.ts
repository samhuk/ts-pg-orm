import { DefaultPluralize, ExpandOneLevel } from '../../helpers/types'
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

export type DataFormat<
  TOptions extends DataFormatOptions = DataFormatOptions,
  TFieldValidations extends (keyof TOptions['fields'])[] = []
> = {
  name: TOptions['name']
  capitalizedName: Capitalize<TOptions['name']>
  pluralizedName: TOptions extends { pluralizedName: string }
    ? TOptions['pluralizedName']
    : DefaultPluralize<TOptions['name']>
  capitalizedPluralizedName: Capitalize<DefaultPluralize<TOptions['name']>>
  fields: Fields<TOptions['fields']>
  fieldNameList: keyof TOptions['fields']
  fieldRefs: FieldRefs<TOptions>
  colNames: { [k in keyof TOptions['fields']]: string }
  colNameList: string[]
  tableName: TOptions extends { tableName: string } ? TOptions['tableName'] : string
  createCreateTableSql: () => string
  dropTableSql: string
  validations: TFieldValidations
  colNameToFieldName: { [colName: string]: keyof TOptions['fields'] }
  defineValidations: <TNewFieldValidations extends (keyof TOptions['fields'])[]>(
    validations: TNewFieldValidations,
  ) => DataFormat<TOptions, TNewFieldValidations>
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
