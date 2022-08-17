import { camelCaseToSnakeCase, capitalize } from '../../helpers/string'
import { Field, FieldOptions } from './types'

export const createField = (fName: string, options: FieldOptions): Field => {
  const capitalizedFName = capitalize(fName)
  return {
    name: fName,
    type: options.type,
    subType: options.subType,
    colName: options.colName ?? camelCaseToSnakeCase(fName),
    capitalizedName: capitalizedFName,
    displayName: options.displayName ?? capitalizedFName,
  }
}
