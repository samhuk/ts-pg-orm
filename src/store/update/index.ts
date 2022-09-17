import { createDataFilter } from '@samhuk/data-filter'
import { SimplePgClient } from 'simple-pg-client/dist/types'
import { DataFormat } from '../../dataFormat/types'
import { createParametersString } from '../../helpers/sql'
import { objectPropsToCamelCase } from '../../helpers/string'
import { UpdateSingleFunctionOptions, UpdateSingleFunctionResult } from './types'

export const updateSingle = async (
  db: SimplePgClient,
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
