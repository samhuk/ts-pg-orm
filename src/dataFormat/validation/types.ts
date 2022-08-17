import { ExpandRecursively, ReadonlyOrMutable, TypeDependantBaseIntersection } from '../../helpers/types'
import { CreateRecordOptions, DataFormatDeclaration, DataFormatField, DataType, ToRecord } from '../types'

export enum FieldValidationType {
  DEF = 'DEF',
  NOT_EMPTY = 'NOT_EMPTY',
  MIN_LEN = 'MIN_LEN',
  MAX_LEN = 'MAX_LEN',
  POS = 'POS',
  NEG = 'NEG',
  MAX_VAL = 'MAX_VAL',
  MIN_VAL = 'MIN_VAL',
  ALPHANUM = 'ALPHANUM',
}

/**
 * Map of field validation type to the prop name for it
 */
export type FieldValidationTypeToOptionsMap = {
  [FieldValidationType.DEF]: {},
  [FieldValidationType.NOT_EMPTY]: {},
  [FieldValidationType.MIN_LEN]: { minLength: number },
  [FieldValidationType.MAX_LEN]: { maxLength?: number },
  [FieldValidationType.POS]: {},
  [FieldValidationType.NEG]: {},
  [FieldValidationType.MAX_VAL]: { maxValue: number },
  [FieldValidationType.MIN_VAL]: { minValue: number },
  [FieldValidationType.ALPHANUM]: {},
}

/**
 * Map of data type to allowed field validation types
 */
export type DataTypeToFieldValidationType = {
  [DataType.BOOLEAN]: FieldValidationType.DEF,
  [DataType.NUMBER]: FieldValidationType.DEF
    | FieldValidationType.POS
    | FieldValidationType.NEG
    | FieldValidationType.MAX_VAL
    | FieldValidationType.MIN_VAL,
  [DataType.STRING]: FieldValidationType.DEF
    | FieldValidationType.NOT_EMPTY
    | FieldValidationType.MIN_LEN
    | FieldValidationType.MAX_LEN
    | FieldValidationType.ALPHANUM,
  [DataType.JSON]: FieldValidationType.DEF
  [DataType.DATE]: FieldValidationType.DEF
}

/**
 * Map of field validation type to the options to configure the validation behavior
 */
export type FieldValidationTypeToOptionsMap = {
  [FieldValidationType.DEF]: {},
  [FieldValidationType.NOT_EMPTY]: {},
  [FieldValidationType.MIN_LEN]: { minLength: number },
  [FieldValidationType.MAX_LEN]: { maxLength?: number },
  [FieldValidationType.POS]: {},
  [FieldValidationType.NEG]: {},
  [FieldValidationType.MAX_VAL]: { maxValue: number },
  [FieldValidationType.MIN_VAL]: { minValue: number },
  [FieldValidationType.ALPHANUM]: {},
}

export type FieldValidationOptions<
  TAllowedFieldValidationTypes extends FieldValidationType = FieldValidationType,
  TFieldValidationType extends TAllowedFieldValidationTypes = TAllowedFieldValidationTypes,
> = ExpandRecursively<TypeDependantBaseIntersection<
  TAllowedFieldValidationTypes,
  FieldValidationTypeToOptionsMap,
  TFieldValidationType
>>

export type FieldValidationOptionsList<
  TDataType extends DataType = DataType
> = FieldValidationOptions<DataTypeToFieldValidationType[TDataType]>[]

export type FieldValidationOptionsListDict<
  T extends ReadonlyOrMutable<DataFormatField[]>
> = { [TFieldName in T[number]['name']]?:
  FieldValidationOptionsList<Extract<T[number], { name: TFieldName }>['dataType']>
}

export type FieldValidationResultBase<TSuccess extends boolean = boolean> = {
  success: TSuccess
} & (TSuccess extends true ? { error: string } : { })

export type FieldValidationResult<
  T extends DataFormatDeclaration = DataFormatDeclaration,
  TIncludedFieldNames extends T['fields'][number]['name'] = T['fields'][number]['name'],
  TFieldName extends TIncludedFieldNames = TIncludedFieldNames,
  TSuccess extends boolean = boolean
> = FieldValidationResultBase<TSuccess> & {
  fieldName: TFieldName
  type: DataTypeToFieldValidationType[Extract<T['fields'][number], { name: TFieldName }>['dataType']]
  // @ts-ignore
  value: Pick<ToRecord<T>, TIncludedFieldNames>[TFieldName]
  success: TSuccess
}

export type ValidateCreateOptionsFieldValidationResult<
  T extends DataFormatDeclaration = DataFormatDeclaration,
  TFieldName extends keyof CreateRecordOptions<T> = keyof CreateRecordOptions<T>,
> = FieldValidationResult<T, keyof CreateRecordOptions<T>, TFieldName>

export type ValidateCreateOptionsResult<
  T extends DataFormatDeclaration = DataFormatDeclaration
> = {
  list: ValidateCreateOptionsFieldValidationResult<T>[]
  dict: { [TFieldName in keyof CreateRecordOptions<T>]: ValidateCreateOptionsFieldValidationResult<T, TFieldName>[] }
}
