import { createDataFilter } from '@samhuk/data-filter'
import { DbService } from 'simple-pg-client/dist/types'
import { DataFormat } from '../../dataFormat/types'
import { objectPropsToCamelCase } from '../../helpers/string'
import { DeleteSingleFunctionOptions, DeleteSingleFunctionResult } from './types'

export const deleteSingle = async (
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
