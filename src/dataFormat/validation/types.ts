import { ExpandRecursively, ReadonlyOrMutable, TypeDependantBaseIntersection } from '../../helpers/types'
import { tsPgOrm } from '../../testData'
import { DataFormatField, DataType } from '../types'

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

type T0 = FieldValidationOptionsList<typeof tsPgOrm['dataFormats']['user']['fields']['name']['dataType']>

const a: T0 = [
  {
    type: FieldValidationType.MAX_LEN,
    maxLength: 50,
  },
]

export type FieldValidationOptionsListDict<
  T extends ReadonlyOrMutable<DataFormatField[]>
> = { [TFieldName in T[number]['name']]?:
  FieldValidationOptionsList<Extract<T[number], { name: TFieldName }>['dataType']>
}

type T1 = FieldValidationOptionsListDict<typeof tsPgOrm['dataFormats']['user']['declaration']['fields']>

const a: T1 = {

}

export type FieldValidationResult = {
  fieldName: string
  type: FieldValidationType
  value: any
}
