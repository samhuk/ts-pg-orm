import { DataQuery } from '@samhuk/data-query/dist/types'
import { COMMON_FIELDS } from '../../../dataFormat/common'
import { createValueList } from '../../../dataFormat/sql'
import {
  CreateRecordOptions,
  DataFormat,
  DataFormatDeclaration,
  DataFormatDeclarationToRecord,
  ManualCreateRecordOptions,
} from '../../../dataFormat/types'
import { createInsertReturningSql } from '../../../helpers/sql'
import { objectPropsToCamelCase } from '../../../helpers/string'
import { StoreBase } from '../types'
import { DbStoreBaseOptions } from './types'
import { DbService } from '../../../types'

async function add<T extends DataFormatDeclaration>(
  db: DbService,
  df: DataFormat<T>,
  options: CreateRecordOptions<T>,
): Promise<DataFormatDeclarationToRecord<T>> {
  const fieldNamesInProvidedCreateOptions = Object.keys(options)
  const fieldNames = df.createRecordFieldNames.filter(f => fieldNamesInProvidedCreateOptions.indexOf(f) !== -1)

  const valueList = createValueList(df, options, fieldNames)
  const sql = createInsertReturningSql(df.sql.tableName, fieldNames.map(f => df.sql.columnNames[f]))
  const row = await db.queryGetFirstRow(sql, valueList)
  return objectPropsToCamelCase(row)
}

async function addManual<T extends DataFormatDeclaration>(
  db: DbService,
  df: DataFormat<T>,
  options: ManualCreateRecordOptions<T>,
): Promise<DataFormatDeclarationToRecord<T>> {
  const fieldNamesInProvidedCreateOptions = Object.keys(options)
  const fieldNames = df.fieldNameList.filter(f => fieldNamesInProvidedCreateOptions.indexOf(f) !== -1)
  /* TODO: Why is this required? ManualCreateRecordOptions<T> clearly will always include all
   * of the fields of the data format declaration, so "f" is obviously able to index "options",
   * but TS doesn't see it.
   */
  // @ts-ignore
  const valueList = fieldNames.map(f => options[f])
  const sql = createInsertReturningSql(df.sql.tableName, fieldNames.map(f => df.sql.columnNames[f]))
  const row = await db.queryGetFirstRow(sql, valueList)
  return objectPropsToCamelCase(row)
}

async function getByDataQuery<T extends DataFormatDeclaration>(
  db: DbService,
  df: DataFormat<T>,
  query: DataQuery,
): Promise<DataFormatDeclarationToRecord<T>[]> {
  const sql = `${df.sql.selectSqlBase} ${query.pSqlSql.orderByLimitOffset}`
  const row = await db.queryGetFirstRow(sql)
  return objectPropsToCamelCase(row)
}

async function getById<T extends DataFormatDeclaration>(
  db: DbService,
  df: DataFormat<T>,
  id: number,
): Promise<DataFormatDeclarationToRecord<T>> {
  const sql = `${df.sql.selectSqlBase} where id = $1 limit 1`
  const row = await db.queryGetFirstRow(sql, [id])
  return objectPropsToCamelCase(row)
}

async function getByUuid<T extends DataFormatDeclaration>(
  db: DbService,
  df: DataFormat<T>,
  uuid: string,
): Promise<DataFormatDeclarationToRecord<T>> {
  const sql = `${df.sql.selectSqlBase} where uuid = $1 limit 1`
  const row = await db.queryGetFirstRow(sql, [uuid])
  return objectPropsToCamelCase(row)
}

async function deleteByUuid<T extends DataFormatDeclaration>(
  db: DbService,
  df: DataFormat<T>,
  uuid: string,
): Promise<boolean> {
  const sql = (
    `update ${df.sql.tableName}
set ${COMMON_FIELDS.dateDeleted.name} = CURRENT_TIMESTAMP
where ${COMMON_FIELDS.uuid.name} = $1
and ${COMMON_FIELDS.dateDeleted.name} is null
limit 1`
  )
  const result = await db.query(sql, [uuid])
  return result.rowCount === 1
}

async function addRandomRecords<T extends DataFormatDeclaration>(
  db: DbService,
  df: DataFormat<T>,
  count: number,
): Promise<DataFormatDeclarationToRecord<T>[]> {
  const recordPromises: Promise<DataFormatDeclarationToRecord<T>>[] = []
  for (let i = 0; i < count; i += 1)
    recordPromises.push(add(db, df, df.createRandomCreateOptions()))
  return Promise.all(recordPromises)
}

export const createDbStoreBase = <
  T extends DataFormatDeclaration,
>(options: DbStoreBaseOptions<T>): StoreBase<T> => {
  const df = options.dataFormat as DataFormat<T>
  const store: StoreBase<T> = {
    add: _options => add(options.db, df, _options),
    addManual: _options => addManual(options.db, df, _options),
    getByDataQuery: query => getByDataQuery(options.db, df, query),
    getById: id => getById(options.db, df, id),
    getByUuid: uuid => getByUuid(options.db, df, uuid),
    deleteByUuid: uuid => deleteByUuid(options.db, df, uuid),
    addRandomRecords: count => addRandomRecords(options.db, df, count),
  }
  return store
}
