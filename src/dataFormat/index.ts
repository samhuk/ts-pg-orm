import { mapDict, toDict } from '../helpers/dict'
import { camelCaseToSnakeCase, capitalize, quote } from '../helpers/string'
import { StringKeysOf } from '../helpers/types'
import { NonManyToManyRelationList } from '../relations/types'
import { filterForCreateRecordField } from './createRecord'
import { createField } from './field'
import { createTableSql } from './sql'
import { DataFormat } from './types'
import { FieldsOptions } from './types/field'
import { FieldSubSetsOptions } from './types/fieldSubSet'

export const createDataFormat = <
  TName extends string,
  TPluralizedName extends string = `${TName}s`,
  TFieldsOptions extends FieldsOptions = FieldsOptions,
  // eslint-disable-next-line arrow-body-style, max-len
>(
    name: TName,
    fieldsOptions: TFieldsOptions,
    pluralizedName?: TPluralizedName,
    tableName?: string,
  ): DataFormat<TName, TPluralizedName, TFieldsOptions, FieldSubSetsOptions<StringKeysOf<TFieldsOptions>>> => {
  const unquotedCols = mapDict(fieldsOptions, (f, fName) => f.columnName ?? camelCaseToSnakeCase(fName))
  const cols = mapDict(unquotedCols, unquotedColName => quote(unquotedColName))
  const unquotedTableName = tableName ?? camelCaseToSnakeCase(name)
  const _tableName = quote(unquotedTableName)
  const fields = mapDict(fieldsOptions, (fieldOptions, fName) => createField(fName, fieldOptions))
  const fieldRefs = mapDict(fieldsOptions, (_, fName) => ({ field: fName, dataFormat: name }))
  const _pluralizedName = pluralizedName ?? `${name}s`
  const fieldList = Object.values(fields)
  const createRecordFields = filterForCreateRecordField(fieldList)

  return {
    name,
    capitalizedName: capitalize(name),
    pluralizedName: _pluralizedName as any,
    capitalizedPluralizedName: capitalize(_pluralizedName) as any,
    fields: fields as any,
    fieldList: fieldList as any,
    fieldNameList: Object.keys(fieldsOptions) as any,
    fieldSubSets: {}, // TODO later
    fieldRefs: fieldRefs as any,
    createRecordFieldNameList: createRecordFields.map(f => f.name) as any,
    sql: {
      cols: cols as any,
      unquotedCols: unquotedCols as any,
      columnNameList: Object.values(cols),
      unquotedColumnNameList: Object.values(unquotedCols),
      tableName: _tableName,
      unquotedTableName,
      createRecordCols: toDict(createRecordFields, item => ({ key: item.name, value: item.sql.columnName })) as any,
      createRecordColumnNameList: createRecordFields.map(f => f.sql.columnName),
      createTableSql: (relations: NonManyToManyRelationList) => createTableSql(_tableName, fieldList, relations),
      dropTableSql: `drop table if exists ${_tableName};`,
    },
  }
}
