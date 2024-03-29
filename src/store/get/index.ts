import { createDataFilter } from '@samhuk/data-filter'
import { createDataQuery } from '@samhuk/data-query'
import { SimplePgClient } from 'simple-pg-client/dist/types'
import { objectPropsToCamelCase } from '../../helpers/string'
import { DataFormat } from '../../dataFormat/types'
import { TsPgOrm } from '../../tsPgOrm/types'
import { createQueryPlan } from './queryPlan/queryPlan'
import { AnyGetFunctionOptions } from './types/getFunctionOptions'
import { AnyGetFunctionResult } from './types/getFunctionResult'

export const determineFieldsToSelectForWhenNoRelations = (
  optionsFieldNames: string[],
  dataFormatFieldNames: string[],
  excludeFields?: boolean,
) => ((excludeFields ?? false)
  ? (optionsFieldNames == null || optionsFieldNames.length === 0)
    ? dataFormatFieldNames
    : dataFormatFieldNames.filter(fName => optionsFieldNames.indexOf(fName) === -1)
  : optionsFieldNames ?? dataFormatFieldNames)

const createColumnsSqlForGetWithNoRelations = (
  options: AnyGetFunctionOptions<false>,
  dataFormat: DataFormat,
) => determineFieldsToSelectForWhenNoRelations(
  options.fields,
  dataFormat.fieldNameList,
  options.excludeFields,
)
  .map(fName => dataFormat.sql.cols[fName])
  .filter(cName => cName != null)
  .join(', ')

const createGetSingleWithNoRelationsSql = (
  options: AnyGetFunctionOptions<false>,
  dataFormat: DataFormat,
): { sql: string, values: any[] } => {
  const columnsSql = createColumnsSqlForGetWithNoRelations(options, dataFormat)

  const whereClause = options.filter != null
    ? createDataFilter(options.filter).toSql({ transformer: node => ({ left: dataFormat.sql.cols[node.field] }) })
    : null
  const rootSelectSql = `select ${columnsSql} from ${dataFormat.sql.tableName}`
  if (whereClause?.sql == null)
    return { sql: `${rootSelectSql} limit 1`, values: [] }

  return { sql: `${rootSelectSql} where ${whereClause.sql} limit 1`, values: whereClause.values }
}

const getSingleWithNoRelations = async (
  options: AnyGetFunctionOptions<false>,
  dataFormat: DataFormat,
  db: SimplePgClient,
): Promise<any> => {
  const sql = createGetSingleWithNoRelationsSql(options, dataFormat)

  const row = await db.queryGetFirstRow(sql.sql, sql.values)

  return objectPropsToCamelCase(row)
}

const createGetMultipleWithNoRelationsSql = (
  options: AnyGetFunctionOptions<true>,
  dataFormat: DataFormat,
): { sql: string, values: any[] } => {
  const columnsSql = createColumnsSqlForGetWithNoRelations(options, dataFormat)

  const querySql = options.query != null
    ? createDataQuery(options.query).toSql({
      includeWhereWord: true,
      filterTransformer: node => ({ left: dataFormat.sql.cols[node.field] }),
      sortingTransformer: node => ({ left: dataFormat.sql.cols[node.field] }),
    })
    : null
  const rootSelectSql = `select ${columnsSql} from ${dataFormat.sql.tableName}`
  if (querySql?.whereOrderByLimitOffset == null)
    return { sql: rootSelectSql, values: [] }

  return { sql: `${rootSelectSql} ${querySql.whereOrderByLimitOffset}`, values: querySql.values }
}

const getMultipleWithNoRelations = async (
  options: AnyGetFunctionOptions<false>,
  dataFormat: DataFormat,
  db: SimplePgClient,
): Promise<any> => {
  const sql = createGetMultipleWithNoRelationsSql(options, dataFormat)

  const rows = await db.queryGetRows(sql.sql)

  return rows.map(r => objectPropsToCamelCase(r), sql.values)
}

export const getSingle = async (
  tsPgOrm: TsPgOrm,
  db: SimplePgClient,
  df: DataFormat,
  options: AnyGetFunctionOptions<false>,
): Promise<AnyGetFunctionResult<false>> => {
  // Performance optimization for query with no relations.
  if (options.relations == null || Object.keys(options.relations).length === 0) {
    const result = await getSingleWithNoRelations(options, df, db)
    return result
  }

  const queryPlan = createQueryPlan(tsPgOrm.relations, tsPgOrm.dataFormats, df, false, options as any)
  const result = await queryPlan.execute(db)
  return result
}

export const getMultiple = async (
  tsPgOrm: TsPgOrm,
  db: SimplePgClient,
  df: DataFormat,
  options: AnyGetFunctionOptions<true>,
): Promise<AnyGetFunctionResult<true>> => {
  // Performance optimization for query with no relations.
  if (options.relations == null || Object.keys(options.relations).length === 0) {
    const result = await getMultipleWithNoRelations(options, df, db)
    return result
  }

  const queryPlan = createQueryPlan(tsPgOrm.relations, tsPgOrm.dataFormats, df, true, options as any)
  const result = await queryPlan.execute(db)
  return result
}
