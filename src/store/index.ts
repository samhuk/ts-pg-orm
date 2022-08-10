import { createDataFilter } from '@samhuk/data-filter'
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
import { getMultiple, getSingle } from './get'
import { createQueryPlan } from './get/queryPlan'
import { Store, UpdateSingleFunctionOptions, UpdateSingleFunctionResult } from './types'

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
  const columnsSql = fieldNamesToUpdate
    .map(fName => df.sql.columnNames[fName])
    .join(', ')
  const parametersSql = createParametersString(fieldNamesToUpdate.length)
  const whereClause = createDataFilter(options.filter).toSql({
    transformer: node => ({ left: df.sql.columnNames[node.field] }),
  })
  const sql = `${df.sql.updateSqlBase} (${columnsSql}) = (${parametersSql}) where ${whereClause}`
  const values = fieldNamesToUpdate.map(fName => options.record[fName])

  const result = await db.query(sql, values)

  return result?.rows?.[0]
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
    getSingle: options => getSingle(tsPgOrm as any, db, localDataFormat, options as any) as any,
    getMultiple: options => getMultiple(tsPgOrm as any, db, localDataFormat, options as any) as any,
    updateSingle: options => updateSingle(db, localDataFormat, options) as any,
    getSingleV4: async options => {
      const queryPlan = createQueryPlan(tsPgOrm.relations, tsPgOrm.dataFormats, localDataFormat, false, options as any)
      // @ts-ignore
      const result = await queryPlan.execute(db)
      return result as any
    },
    getMultipleV4: async options => {
      const queryPlan = createQueryPlan(tsPgOrm.relations, tsPgOrm.dataFormats, localDataFormat, true, options as any)
      // @ts-ignore
      const result = await queryPlan.execute(db)
      return result as any
    },
  }
}
