import { camelCaseToSnakeCase, quote } from '../../helpers/string'
import { Field, FieldOptions } from './types/field'

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
