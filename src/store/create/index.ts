import { SimplePgClient } from 'simple-pg-client/dist/types'
import { DataFormat } from '../../dataFormat/types'
import { CreateRecordOptions, ManualCreateRecordOptions } from '../../dataFormat/types/createRecordOptions'
import { ToRecord } from '../../dataFormat/types/record'
import { createInsertReturningSql } from '../../helpers/sql'
import { objectPropsToCamelCase } from '../../helpers/string'

export const create = async <TDataFormat extends DataFormat>(
  db: SimplePgClient,
  df: TDataFormat,
  options: CreateRecordOptions<TDataFormat>,
): Promise<ToRecord<TDataFormat>> => {
  const fieldNamesInProvidedCreateOptions = Object.keys(options)
  const fieldNames = df.createRecordFieldNameList.filter(f => fieldNamesInProvidedCreateOptions.indexOf(f) !== -1)

  const valueList = fieldNames.map(fName => (options as any)[fName])
  const sql = createInsertReturningSql(df.sql.tableName, fieldNames.map(f => df.sql.cols[f]))
  const row = await db.queryGetFirstRow(sql, valueList)
  return objectPropsToCamelCase(row)
}

export const createManual = async <TDataFormat extends DataFormat>(
  db: SimplePgClient,
  df: TDataFormat,
  options: ManualCreateRecordOptions<TDataFormat>,
): Promise<ToRecord<TDataFormat>> => {
  const fieldNamesInProvidedCreateOptions = Object.keys(options)
  const fieldNames = df.fieldNameList.filter(f => fieldNamesInProvidedCreateOptions.indexOf(f) !== -1)

  const valueList = fieldNames.map(f => (options as any)[f])
  const sql = createInsertReturningSql(df.sql.tableName, fieldNames.map(f => df.sql.cols[f]))
  const row = await db.queryGetFirstRow(sql, valueList)
  return objectPropsToCamelCase(row)
}
