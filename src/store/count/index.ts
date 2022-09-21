import { createDataQuery } from '@samhuk/data-query'
import { SimplePgClient } from 'simple-pg-client/dist/types'
import { DataFormat } from '../../dataFormat/types'
import { CountFunctionOptions, CountFunctionResult } from './types'

export const count = async (
  db: SimplePgClient,
  df: DataFormat,
  options?: CountFunctionOptions,
): CountFunctionResult => {
  const queryInfo = options != null
    ? createDataQuery(options).toSql({
      filterTransformer: node => ({ left: df.sql.columnNames[node.field] }),
      sortingTransformer: node => ({ left: df.sql.columnNames[node.field] }),
    })
    : null

  const sqlParts: string[] = ['select count(*) as exact_count']

  // If there is no OBLO, then we can do a simple count statement
  if (queryInfo?.orderByLimitOffset == null) {
    sqlParts.push(`from ${df.sql.tableName}`)
    sqlParts.push(queryInfo?.where)
  }
  // Else, we need a CTE
  else {
    sqlParts.push('from (')
    sqlParts.push(`select 1 from ${df.sql.tableName}`)
    sqlParts.push(queryInfo?.where)
    sqlParts.push(queryInfo?.orderByLimitOffset)
    sqlParts.push(') as cte')
  }

  const sql = sqlParts.filter(s => s != null).join('\n')

  const row = await db.queryGetFirstRow(sql)
  const countRaw = (row as any).exact_count
  if (countRaw == null)
    return null
  if (typeof countRaw === 'number')
    return countRaw
  if (typeof countRaw === 'string')
    return parseInt(countRaw)

  return null
}
