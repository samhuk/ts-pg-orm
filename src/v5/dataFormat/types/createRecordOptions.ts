import { ExpandOneLevel, PickAny, ValuesUnionFromDict } from '../../../helpers/types'
import { DataType, NumSubType, StrSubType } from './dataType'
import { Fields } from './field'
import { ExtractHasDefaultFieldNames, ExtractOptionalRecordFieldNames, ExtractRequiredRecordFieldNames, ToRecord } from './record'

/**
 * Extracts the field names from the given data format declaration that
 * are not auto-generated in some fashion, i.e. dateCreated fields, id fields,
 * uuid fields, and so on.
 */
type ExtractAutoGeneratedFieldNames<TFields extends Fields> =
  Extract<
    ValuesUnionFromDict<TFields>,
    // Include datetime fields that default to current epoch
    { type: DataType.EPOCH, defaultToCurrentEpoch: true }
    // Include serial number fields (i.e. typically "id")
    | { type: DataType.NUM, subType: NumSubType.SERIAL }
    // Include string fields that default to an auto-generated uuid (i.e. v4uuid)
    | { type: DataType.STR, subType: StrSubType.UUID_V4, autoGenerate: true }
  >['name']

type ExtractExplicitExcludeInCreateOptionsFieldNames<TFields extends Fields> = Extract<
  ValuesUnionFromDict<TFields>,
  { excludeFromCreateOptions: true }
>['name']

/**
 * Extracts the field names from the given data format declaration that
 * have a defined default value.
 */
type ExtractFieldNamesWithDefaults<TFields extends Fields> =
  Extract<ValuesUnionFromDict<TFields>, { default: any }>['name']

type CreateRecordOptionsFieldNames<TFields extends Fields> = Exclude<
  ValuesUnionFromDict<TFields>['name'],
  ExtractAutoGeneratedFieldNames<TFields> | ExtractExplicitExcludeInCreateOptionsFieldNames<TFields>
>

type CreateRecordOptionsRequiredFieldNames<TFields extends Fields> = Exclude<
  CreateRecordOptionsFieldNames<TFields> & ExtractRequiredRecordFieldNames<TFields>,
  ExtractHasDefaultFieldNames<TFields>
>

type CreateRecordOptionsOptionalFieldNames<TFields extends Fields> =
  (CreateRecordOptionsFieldNames<TFields> & ExtractOptionalRecordFieldNames<TFields>)
  | ExtractHasDefaultFieldNames<TFields>

/**
 * Creates a type that can be used to create a record for the given data format declaration.
 *
 * This takes fields out of the standard record type that are auto-generated.
 */
export type CreateRecordOptions<TFields extends Fields> = ExpandOneLevel<
  // Required fields: don't have defaults
  PickAny<
    ToRecord<TFields>,
    CreateRecordOptionsRequiredFieldNames<TFields>
  >
  // Optional fields: have defaults or allow null
  & Partial<
    PickAny<
      ToRecord<TFields>,
      CreateRecordOptionsOptionalFieldNames<TFields>
    >
  >
>

type _ManualCreateRecordOptions<TFields extends Fields> =
  // Pick auto-generated fields (optional)
  Partial<
    PickAny<
      ToRecord<TFields>,
      ExtractAutoGeneratedFieldNames<TFields>
    >
  >
  // Pick fields with defaults (optional)
  & Partial<
    PickAny<
    ToRecord<TFields>,
      ExtractFieldNamesWithDefaults<TFields>
    >
  >
  // Pick rest of fields (required)
  & Omit<
    ToRecord<TFields>,
    ExtractAutoGeneratedFieldNames<TFields> | ExtractFieldNamesWithDefaults<TFields>
  >

export type ManualCreateRecordOptions<TFields extends Fields> = _ManualCreateRecordOptions<TFields>

export type CreateRecordFieldNames<TFields extends Fields> = (keyof CreateRecordOptions<TFields>)[]
