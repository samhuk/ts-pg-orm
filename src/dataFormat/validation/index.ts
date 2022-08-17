import { capitalize } from '../../helpers/string'
import { DataFormat, DataFormatDeclaration, DataFormatField, ToRecord } from '../types'
import {
  FieldValidationOptions,
  FieldValidationOptionsList,
  FieldValidationResult,
  FieldValidationResultBase,
  FieldValidationType,
  ValidateCreateOptionsFieldValidationResult,
  ValidateCreateOptionsResult,
} from './types'

const validateDef = (
  field: DataFormatField,
  fieldValues: any,
  fieldValidationOptions: FieldValidationOptions<FieldValidationType, FieldValidationType.DEF>,
): FieldValidationResultBase => {
  const fieldValue = fieldValues[field.name]
  const success = fieldValue != null
  return success ? { success: true } : { success, error: `${capitalize(field.name)} must be defined.` }
}

const validate = (
  field: DataFormatField,
  fieldValues: any,
  fieldValidationOptions: FieldValidationOptions<FieldValidationType, FieldValidationType.MAX_LEN>,
): FieldValidationResultBase => {
  const fieldValue = fieldValues[field.name]
  const success = fieldValue
  return success ? { success: true } : { success, error: `${capitalize(field.name)} must be defined.` }
}

const validateFieldValidationOptions = (
  field: DataFormatField,
  fieldValues: any,
  fieldValidationOptions: FieldValidationOptions,
): FieldValidationResult => {
  const fieldValue = fieldValues[field.name]

}

const validateField = (
  field: DataFormatField,
  fieldValues: any,
  fieldValidationOptionsList: FieldValidationOptionsList,
): FieldValidationResult[] => (
  fieldValidationOptionsList.reduce<FieldValidationResult[]>((acc, fieldValidationOptions) => (
    acc.concat(validateFieldValidationOptions(field, fieldValues, fieldValidationOptions))
  ), [])
)

export const validateRecord = <
  T extends DataFormatDeclaration,
>(
    df: DataFormat<T>,
    fieldValues: ToRecord<T>,
  ): ValidateCreateOptionsResult<T> => {
  const dict: { [fieldName: string]: ValidateCreateOptionsFieldValidationResult<T>[] } = { }
  const list = Object.entries(df.declaration.validations)
    .reduce<ValidateCreateOptionsFieldValidationResult<T>[]>((acc, [fieldName, fieldValidationOptionsList]) => {
      const dataFormatField = (df.fields as any)[fieldName] as DataFormatField
      const resultsList = validateField(dataFormatField, fieldValues, fieldValidationOptionsList as any)
      return acc.concat(resultsList as any)
    }, [])

  return {
    list,
    dict,
  } as any
}
