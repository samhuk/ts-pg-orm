import { ExpandOneLevel } from '../../helpers/types'
import { Fields, FieldToRecordType } from '../field/types'

/**
 * Extracts the field names where `optional` is explicitly true.
 */
type ExtractExplicitOptionalTrueFieldNames<T extends Fields> = Extract<T[keyof T], { optional: true }>['name']

/**
* Extracts the field names where `optional` is explicitly false.
*/
type ExtractExplicitOptionalFalseFieldNames<T extends Fields> = Extract<T[keyof T], { optional: false }>['name']

/**
* Extracts the field names where `optional` is some kind of boolean.
*/
type ExtractExplicitOptionalBooleanFieldNames<T extends Fields> = Extract<T[keyof T], { optional: boolean }>['name']

/**
* Extracts the field names where `optional` is explicitly unprovided (and therefore is not part of the field type).
*/
type ExtractExplicitOptionalUnprovidedFieldNames<T extends Fields> = Exclude<
  keyof T,
  ExtractExplicitOptionalBooleanFieldNames<T>
>

/**
* Extracts the field names where `optional` is a boolean (provided somehow) but is not specifically true or false.
*/
type ExtractAmbiguousOptionalBooleanFieldNames<T extends Fields> = Exclude<
  ExtractExplicitOptionalBooleanFieldNames<T>,
  ExtractExplicitOptionalTrueFieldNames<T> | ExtractExplicitOptionalFalseFieldNames<T>
>

/**
* Extracts the field names that are required
*/
type ExtractRequiredRecordFieldNames<T extends Fields> =
  ExtractExplicitOptionalFalseFieldNames<T>
  | ExtractExplicitOptionalUnprovidedFieldNames<T>
  | ExtractAmbiguousOptionalBooleanFieldNames<T>

/**
* Converts the given data format declaration to a record - i.e. a type
* that reflects a hypothetical "row" of the data of the data format.
*/
export type FieldsToRecord<T extends Fields> = ExpandOneLevel<
  { [TFieldName in ExtractExplicitOptionalTrueFieldNames<T>]?: FieldToRecordType<T[TFieldName]> }
  & { [TFieldName in ExtractRequiredRecordFieldNames<T>]: FieldToRecordType<T[TFieldName]> }
>
