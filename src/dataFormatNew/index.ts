import { camelCaseToSnakeCase, capitalize, defaultPluralize } from '../helpers/string'
import { createField } from './field'
import { Fields } from './field/types'
import { DataFormat, DataFormatOptions } from './types'
import { FieldRefs } from './types/fieldRef'

export const createDataFormat = <
  TDataFormatOptions extends DataFormatOptions
>(
    options: TDataFormatOptions,
  ): DataFormat<TDataFormatOptions> => {
  // Names
  const capitalizedName = capitalize<typeof options['name']>(options.name)
  const pluralizedName = options.pluralizedName ?? defaultPluralize(options.name)
  const capitalizedPluralizedName = capitalize(pluralizedName)

  // Fields and columns
  const colNames: { [fieldName: string]: string } = { }
  const colNameList: string[] = []
  const fieldNameList: string[] = []
  const fields: Fields = {}
  const colNameToFieldName: { [colName: string]: string } = { }
  const fieldRefs: FieldRefs = {}

  Object.entries(options.fields).forEach(([fName, fOptions]) => {
    const field = createField(fName, fOptions)
    fields[fName] = field
    colNames[fName] = field.colName
    colNameList.push(field.colName)
    fieldNameList.push(fName)
    colNameToFieldName[field.colName] = fName
  })

  const tableName = options.tableName ?? `"${camelCaseToSnakeCase(options.name)}"`
  const dropTableSql = `drop table if exists ${tableName}`

  return {
    name: options.name,
    capitalizedName,
    // @ts-ignore
    pluralizedName,
    // @ts-ignore
    capitalizedPluralizedName,
    fields,
    colNameList,
    // @ts-ignore
    colNames,
    colNameToFieldName,
    createCreateTableSql: undefined,
    // @ts-ignore
    tableName,
    defineValidations: undefined,
    dropTableSql,
    // @ts-ignore
    fieldNameList,
    // @ts-ignore
    fieldRefs,
    validations: [],
  }
}
