import { DbService } from 'simple-pg-client/dist/types'
import { createValueList } from '../../dataFormat/sql'
import { DataFormatDeclaration, DataFormat, CreateRecordOptions, ToRecord, ManualCreateRecordOptions } from '../../dataFormat/types'
import { createInsertReturningSql } from '../../helpers/sql'
import { objectPropsToCamelCase } from '../../helpers/string'

export const create = async <T extends DataFormatDeclaration>(
  db: DbService,
  df: DataFormat<T>,
  options: CreateRecordOptions<T>,
): Promise<ToRecord<T>> => {
  const fieldNamesInProvidedCreateOptions = Object.keys(options)
  const fieldNames = df.createRecordFieldNames.filter(f => fieldNamesInProvidedCreateOptions.indexOf(f) !== -1)

  const valueList = createValueList(df, options, fieldNames)
  const sql = createInsertReturningSql(df.sql.tableName, fieldNames.map(f => df.sql.columnNames[f]))
  const row = await db.queryGetFirstRow(sql, valueList)
  return objectPropsToCamelCase(row)
}

export const createManual = async <T extends DataFormatDeclaration>(
  db: DbService,
  df: DataFormat<T>,
  options: ManualCreateRecordOptions<T>,
): Promise<ToRecord<T>> => {
  const fieldNamesInProvidedCreateOptions = Object.keys(options)
  const fieldNames = df.fieldNameList.filter(f => fieldNamesInProvidedCreateOptions.indexOf(f) !== -1)
  const valueList = fieldNames.map(f => (options as any)[f])
  const sql = createInsertReturningSql(df.sql.tableName, fieldNames.map(f => df.sql.columnNames[f]))
  const row = await db.queryGetFirstRow(sql, valueList)
  return objectPropsToCamelCase(row)
}
