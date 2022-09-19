import { createDataFilter } from '@samhuk/data-filter'
import { SimplePgClient } from 'simple-pg-client/dist/types'
import { DataFormat } from '../../dataFormat/types'
import { objectPropsToCamelCase } from '../../helpers/string'
import { DeleteFunctionOptions, DeleteFunctionResult } from './types'

export const _delete = async (
  db: SimplePgClient,
  df: DataFormat,
  options: DeleteFunctionOptions,
): Promise<DeleteFunctionResult> => {
  const rootSql = df.sql.deleteSqlBase
  const whereClause = createDataFilter(options.filter).toSql({
    transformer: node => ({ left: df.sql.columnNames[node.field] }),
  })
  const returnRecord = options.return ?? false
  const sql = `${rootSql} where ${whereClause} returning ${returnRecord ? '*' : '1'}`

  const row = await db.queryGetFirstRow(sql)
  return (returnRecord ? objectPropsToCamelCase(row) : row != null) as any
}
