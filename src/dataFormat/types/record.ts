import { DataFormat } from '.'
import { ExpandOneLevel, ValuesUnionFromDict } from '../../helpers/types'
import { Fields, FieldToRecordType } from './field'

/**
 * Extracts the field names where `allowNull` is explicitly true.
 */
export type ExtractExplicitAllowNullTrueFieldNames<TFields extends Fields> = Extract<ValuesUnionFromDict<TFields>, { allowNull: true }>['name']

/**
 * Extracts the field names where `allowNull` is explicitly false.
 */
export type ExtractExplicitAllowNullFalseFieldNames<TFields extends Fields> = Extract<ValuesUnionFromDict<TFields>, { allowNull: false }>['name']

/**
 * Extracts the field names where `allowNull` is some kind of boolean.
 */
export type ExtractExplicitAllowNullBooleanFieldNames<TFields extends Fields> = Extract<ValuesUnionFromDict<TFields>, { allowNull: boolean }>['name']

/**
 * Extracts the field names where `allowNull` is explicitly unprovided (and therefore is not part of the field type).
 */
export type ExtractExplicitAllowNullUnprovidedFieldNames<TFields extends Fields> = Exclude<
  ValuesUnionFromDict<TFields>['name'],
  ExtractExplicitAllowNullBooleanFieldNames<TFields>
>

/**
 * Extracts the field names where `allowNull` is a boolean (provided somehow) but is not specifically true or false.
 */
export type ExtractAmbiguousAllowNullBooleanFieldNames<TFields extends Fields> = Exclude<
  ExtractExplicitAllowNullBooleanFieldNames<TFields>,
  ExtractExplicitAllowNullTrueFieldNames<TFields> | ExtractExplicitAllowNullFalseFieldNames<TFields>
>

export type ExtractHasDefaultFieldNames<TFields extends Fields> = Extract<
  ValuesUnionFromDict<TFields>,
  { default: any }
>['name']

/**
 * Extracts the field names that should be required in the record for the given data format declaration.
 */
export type ExtractRequiredRecordFieldNames<TFields extends Fields> =
  ExtractExplicitAllowNullFalseFieldNames<TFields>
  | ExtractExplicitAllowNullUnprovidedFieldNames<TFields>
  | ExtractAmbiguousAllowNullBooleanFieldNames<TFields>

export type ExtractOptionalRecordFieldNames<TFields extends Fields> =
  ExtractExplicitAllowNullTrueFieldNames<TFields>

export type FieldsToRecord<TFields extends Fields> = ExpandOneLevel<
  {
    [TFieldName in keyof TFields as TFieldName extends ExtractOptionalRecordFieldNames<TFields> ? TFieldName : never]?:
      FieldToRecordType<TFields[TFieldName]>
  }
  & {
    [TFieldName in keyof TFields as TFieldName extends ExtractRequiredRecordFieldNames<TFields> ? TFieldName : never]:
      FieldToRecordType<TFields[TFieldName]>
  }
>

export type ToRecord<TDataFormat extends DataFormat = DataFormat> =
  FieldsToRecord<TDataFormat['fields']>
