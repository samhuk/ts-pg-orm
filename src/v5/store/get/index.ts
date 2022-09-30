import { createDataFilter } from '@samhuk/data-filter'
import { createDataQuery } from '@samhuk/data-query'
import { SimplePgClient } from 'simple-pg-client/dist/types'
import { objectPropsToCamelCase } from '../../../helpers/string'
import { DataFormat } from '../../dataFormat/types'
import { TsPgOrm } from '../../types'
import { createQueryPlan } from './queryPlan/queryPlan'
import { AnyGetFunctionOptions, AnyGetFunctionResult } from './types'

const createColumnsSqlForGetWithNoRelations = (
  options: AnyGetFunctionOptions<false>,
  dataFormat: DataFormat,
) => (options.fields ?? dataFormat.fieldNameList)
  .map(fName => dataFormat.sql.cols[fName])
  .filter(cName => cName != null)
  .join(', ')

const createGetSingleWithNoRelationsSql = (
  options: AnyGetFunctionOptions<false>,
  dataFormat: DataFormat,
): string => {
  const columnsSql = createColumnsSqlForGetWithNoRelations(options, dataFormat)

  const whereClause = options.filter != null
    ? createDataFilter(options.filter).toSql({ transformer: node => ({ left: dataFormat.sql.cols[node.field] }) })
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
      filterTransformer: node => ({ left: dataFormat.sql.cols[node.field] }),
      sortingTransformer: node => ({ left: dataFormat.sql.cols[node.field] }),
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
