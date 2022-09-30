import { mapDict } from '../../helpers/dict'
import { camelCaseToSnakeCase, capitalize, quote } from '../../helpers/string'
import { NonManyToManyRelationList, RelationList } from '../relations/types'
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
  ): DataFormat<TName, TPluralizedName, TFieldsOptions, FieldSubSetsOptions<(keyof TFieldsOptions) & string>> => {
  const unquotedCols = mapDict(fieldsOptions, (f, fName) => f.columnName ?? camelCaseToSnakeCase(fName))
  const cols = mapDict(unquotedCols, unquotedColName => quote(unquotedColName))
  const unquotedTableName = tableName ?? camelCaseToSnakeCase(name)
  const fields = mapDict(fieldsOptions, (fieldOptions, fName) => createField(fName, fieldOptions))
  const fieldRefs = mapDict(fieldsOptions, (_, fName) => ({ field: fName, dataFormat: name }))
  const _pluralizedName = pluralizedName ?? `${name}s`
  const fieldList = Object.values(fields)

  return {
    name,
    capitalizedName: capitalize(name),
    pluralizedName: _pluralizedName as any,
    capitalizedPluralizedName: capitalize(_pluralizedName) as any,
    fields: fields as any,
    fieldList: fieldList as any,
    fieldNameList: Object.keys(fieldsOptions),
    fieldSubSets: {},
    fieldRefs: fieldRefs as any,
    createRecordFieldNameList: [] as any[],
    sql: {
      cols: cols as any,
      unquotedCols: unquotedCols as any,
      columnNameList: Object.values(cols),
      unquotedColumnNameList: Object.values(unquotedCols),
      tableName: quote(unquotedTableName),
      unquotedTableName,
      createRecordCols: {} as any,
      createRecordColumnNameList: [] as any[],
      createTableSql: (relations: NonManyToManyRelationList) => createTableSql(name, fieldList, relations),
    },
  }
}
