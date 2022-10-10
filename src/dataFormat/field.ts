import { camelCaseToSnakeCase, quote } from '../helpers/string'
import { Field, FieldOptions, FieldsOptions } from './types/field'

/**
 * For creating a reusable group of fields that can be used across Data Formats.
 *
 * This is useful when multiple of your Data Formats share some common fields, like
 * "dateCreated", "dataDeleted", "name", and so on.
 */
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
