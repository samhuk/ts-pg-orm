import { createDataFilter } from '@samhuk/data-filter'
import { createDataQuery } from '@samhuk/data-query'
import { DbService, SimplePgClient } from 'simple-pg-client/dist/types'
import { createValueList } from '../dataFormat/sql'
import {
  CreateRecordOptions,
  DataFormat,
  DataFormatDeclaration,
  DataFormatDeclarations,
  ManualCreateRecordOptions,
  ToRecord,
} from '../dataFormat/types'
import { createInsertReturningSql, createParametersString } from '../helpers/sql'
import { objectPropsToCamelCase } from '../helpers/string'
import { ExtractRelevantRelations, Relation, RelationDeclarations, RelationsDict, RelationType } from '../relations/types'
import { TsPgOrm } from '../types'
import { createQueryPlan } from './get/queryPlan'
import { DeleteSingleFunctionOptions, DeleteSingleFunctionResult, Store, UpdateSingleFunctionOptions, UpdateSingleFunctionResult } from './types'
import { AnyGetFunctionOptions } from './types/get'

const create = async <T extends DataFormatDeclaration>(
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

const createManual = async <T extends DataFormatDeclaration>(
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

const updateSingle = async (
  db: DbService,
  df: DataFormat,
  options: UpdateSingleFunctionOptions,
): Promise<UpdateSingleFunctionResult> => {
  const fieldNamesToUpdate = Object.keys(options.record)
    .filter(fName => df.sql.columnNames[fName] != null)
  if (fieldNamesToUpdate.length === 0)
    return null

  const columnNamesToUpdate = fieldNamesToUpdate
    .map(fName => df.sql.columnNames[fName])

  const whereClause = createDataFilter(options.filter).toSql({
    transformer: node => ({ left: df.sql.columnNames[node.field] }),
  })
  const returnRecord = options.return ?? false
  const suffix = `where ${whereClause} returning ${returnRecord ? '*' : '1'}`
  let columnsAndValuesSql: string
  if (fieldNamesToUpdate.length > 1) {
    const columnsSql = columnNamesToUpdate.join(', ')
    const parametersSql = createParametersString(fieldNamesToUpdate.length)
    columnsAndValuesSql = `(${columnsSql}) = (${parametersSql})`
  }
  else {
    columnsAndValuesSql = `${columnNamesToUpdate[0]} = $1`
  }
  const sql = `${df.sql.updateSqlBase} ${columnsAndValuesSql} ${suffix}`
  const values = fieldNamesToUpdate.map(fName => options.record[fName])

  const row = await db.queryGetFirstRow(sql, values)
  return (returnRecord ? objectPropsToCamelCase(row) : row != null) as any
}

const deleteSingle = async (
  db: DbService,
  df: DataFormat,
  options: DeleteSingleFunctionOptions,
): Promise<DeleteSingleFunctionResult> => {
  const rootSql = df.sql.deleteSqlBase
  const whereClause = createDataFilter(options.filter).toSql({
    transformer: node => ({ left: df.sql.columnNames[node.field] }),
  })
  const returnRecord = options.return ?? false
  const sql = `${rootSql} where ${whereClause} returning ${returnRecord ? '*' : '1'}`

  const row = await db.queryGetFirstRow(sql)
  return (returnRecord ? objectPropsToCamelCase(row) : row != null) as any
}

export const getRelationsRelevantToDataFormat = <
  T extends DataFormatDeclarations,
  K extends Relation<T>[],
  L extends T[number]['name'],
>(relationList: K, dataFormatName: L): ExtractRelevantRelations<L, K>[] => (
  relationList.filter(d => (
    (d.type === RelationType.ONE_TO_ONE && d.fromOneField.formatName === dataFormatName)
    || (d.type === RelationType.ONE_TO_ONE && d.toOneField.formatName === dataFormatName)
    || (d.type === RelationType.ONE_TO_MANY && d.fromOneField.formatName === dataFormatName)
    || (d.type === RelationType.ONE_TO_MANY && d.toManyField.formatName === dataFormatName)
    || (d.type === RelationType.MANY_TO_MANY && d.fieldRef1.formatName === dataFormatName)
    || (d.type === RelationType.MANY_TO_MANY && d.fieldRef2.formatName === dataFormatName)
  )) as ExtractRelevantRelations<L, K>[]
  )

/**
 * Finds all of the relations where this data format requires a foreign key. This will be the
 * case if this data format is being referenced as the "to many" of any "one to many" relations
 * or as the "to one" of any "one to one" relations.
 */
const getRelevantRelationsForForeignKeys = <
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name']
>(
    relationsDict: RelationsDict<T, K>,
    localDataFormatName: L,
  ) => Object.values(relationsDict)
    .filter(r => {
      const _r = r as Relation<T>
      return (_r.type === RelationType.ONE_TO_MANY && _r.toManyField.formatName === localDataFormatName)
        || (_r.type === RelationType.ONE_TO_ONE && _r.toOneField.formatName === localDataFormatName)
    }) as Relation<T, RelationType.ONE_TO_MANY | RelationType.ONE_TO_ONE>[]

const createColumnsSqlForGetWithNoRelations = (
  options: AnyGetFunctionOptions<false>,
  dataFormat: DataFormat,
) => (options.fields ?? dataFormat.fieldNameList)
  .map(fName => dataFormat.sql.columnNames[fName])
  .filter(cName => cName != null)
  .join(', ')

const createGetSingleWithNoRelationsSql = (
  options: AnyGetFunctionOptions<false>,
  dataFormat: DataFormat,
): string => {
  const columnsSql = createColumnsSqlForGetWithNoRelations(options, dataFormat)

  const whereClause = options.filter != null
    ? createDataFilter(options.filter).toSql({ transformer: node => ({ left: dataFormat.sql.columnNames[node.field] }) })
    : null
  const rootSelectSql = `select ${columnsSql} from ${dataFormat.sql.tableName}`
  if (whereClause == null)
    return `${rootSelectSql} limit 1`

  return `${rootSelectSql} where ${whereClause} limit 1`
}

const getSingleWithNoRelations = async (
  options: AnyGetFunctionOptions<false>,
  dataFormat: DataFormat,
  db: SimplePgClient,
): Promise<any> => {
  const sql = createGetSingleWithNoRelationsSql(options, dataFormat)

  const row = await db.queryGetFirstRow(sql)

  return objectPropsToCamelCase(row)
}

const createGetMultipleWithNoRelationsSql = (
  options: AnyGetFunctionOptions<true>,
  dataFormat: DataFormat,
): string => {
  const columnsSql = createColumnsSqlForGetWithNoRelations(options, dataFormat)

  const querySql = options.query != null
    ? createDataQuery(options.query).toSql({
      filterTransformer: node => ({ left: dataFormat.sql.columnNames[node.field] }),
      sortingTransformer: node => ({ left: dataFormat.sql.columnNames[node.field] }),
    })
    : null
  const rootSelectSql = `select ${columnsSql} from ${dataFormat.sql.tableName}`
  if (querySql == null)
    return `${rootSelectSql} limit 1`

  return `${rootSelectSql} ${querySql.whereOrderByLimitOffset}`
}

const getMultipleWithNoRelations = async (
  options: AnyGetFunctionOptions<false>,
  dataFormat: DataFormat,
  db: SimplePgClient,
): Promise<any> => {
  const sql = createGetMultipleWithNoRelationsSql(options, dataFormat)

  const rows = await db.queryGetRows(sql)

  return rows.map(r => objectPropsToCamelCase(r))
}

export const createStore = <
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
>(
    db: SimplePgClient,
    tsPgOrm: TsPgOrm<T, K>,
    localDataFormatName: L,
  ): Store<T, K, L> => {
  const localDataFormat = (tsPgOrm.dataFormats as any)[localDataFormatName] as DataFormat
  const foreignKeyRelevantRelations = getRelevantRelationsForForeignKeys(tsPgOrm.relations, localDataFormatName)
  const createTableSql = localDataFormat.sql.createCreateTableSql(foreignKeyRelevantRelations)

  return {
    provision: () => db.query(createTableSql) as Promise<any>,
    unprovision: () => db.query(`drop table if exists ${localDataFormat.sql.tableName}`) as Promise<any>,
    create: options => create(db, localDataFormat, options) as any,
    createManual: options => createManual(db, localDataFormat, options) as any,
    updateSingle: options => updateSingle(db, localDataFormat, options) as any,
    deleteSingle: options => deleteSingle(db, localDataFormat, options) as any,
    getSingle: async options => {
      // Performance optimization for query with no relations.
      if (options.relations == null || Object.keys(options.relations).length === 0) {
        const result = await getSingleWithNoRelations(options as any, localDataFormat, db)
        return result
      }

      const queryPlan = createQueryPlan(tsPgOrm.relations, tsPgOrm.dataFormats, localDataFormat, false, options as any)
      // @ts-ignore
      const result = await queryPlan.execute(db)
      return result
    },
    getMultiple: async options => {
      // Performance optimization for query with no relations.
      if (options.relations == null || Object.keys(options.relations).length === 0) {
        const result = await getMultipleWithNoRelations(options as any, localDataFormat, db)
        return result
      }

      const queryPlan = createQueryPlan(tsPgOrm.relations, tsPgOrm.dataFormats, localDataFormat, true, options as any)
      // @ts-ignore
      const result = await queryPlan.execute(db)
      return result
    },
  }
}
