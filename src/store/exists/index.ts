import { createDataQuery } from '@samhuk/data-query'
import { SimplePgClient } from 'simple-pg-client/dist/types'
import { DataFormat } from '../../dataFormat/types'
import { ExistsFunctionOptions, ExistsFunctionResult } from './types'

export const exists = async (
  db: SimplePgClient,
  df: DataFormat,
  options?: ExistsFunctionOptions,
): ExistsFunctionResult => {
  const queryInfo = options != null
    ? createDataQuery(options).toSql({
      filterTransformer: node => ({ left: df.sql.cols[node.field] }),
      sortingTransformer: node => ({ left: df.sql.cols[node.field] }),
    })
    : null

  const sqlParts: string[] = ['select exists (']

  sqlParts.push(`select 1 from ${df.sql.tableName}`)
  sqlParts.push(queryInfo?.where)
  sqlParts.push(queryInfo?.orderByLimitOffset)

  sqlParts.push(')')

  const sql = sqlParts.filter(s => s != null).join('\n')

  const row = await db.queryGetFirstRow(sql)
  return (row as any).exists === true
}
