import { camelCaseToSnakeCase, quote } from '../helpers/string'
import { Field, FieldOptions, FieldsOptions } from './types/field'

export const createCommonFields = <T extends FieldsOptions>(v: T): T => v

export const createField = (fieldName: string, fieldOptions: FieldOptions): Field => {
  const unquotedColumnName = fieldOptions.columnName ?? camelCaseToSnakeCase(fieldName)
  return {
    ...fieldOptions,
    name: fieldName,
    sql: {
      columnName: quote(unquotedColumnName),
      unquotedColumnName,
    },
  }
}
