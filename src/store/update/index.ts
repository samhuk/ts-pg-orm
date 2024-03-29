import { createDataQuery } from '@samhuk/data-query'
import { SimplePgClient } from 'simple-pg-client/dist/types'
import { DataFormat } from '../../dataFormat/types'
import { createParametersString } from '../../helpers/sql'
import { objectPropsToCamelCase } from '../../helpers/string'
import { ReturnModeRaw, ReturnMode } from '../types'
import { UpdateFunctionOptions, UpdateFunctionResult } from './types'

const determineReturnMode = (returnMode: ReturnModeRaw): ReturnMode => (
  returnMode == null
    ? ReturnMode.RETURN_COUNT
    : typeof returnMode === 'boolean'
      ? returnMode
        ? ReturnMode.RETURN_ALL_ROWS
        : ReturnMode.RETURN_COUNT
      : returnMode === 'first'
        ? ReturnMode.RETURN_FIRST_ROW
        : ReturnMode.RETURN_COUNT
)

export const update = async (
  db: SimplePgClient,
  df: DataFormat,
  options: UpdateFunctionOptions,
): Promise<UpdateFunctionResult> => {
  const fieldNamesToUpdate = Object.keys(options.record)
    .filter(fName => df.sql.cols[fName] != null)

  const values = fieldNamesToUpdate.map(fName => options.record[fName])

  const returnMode = determineReturnMode(options.return)
  if (fieldNamesToUpdate.length === 0) {
    switch (returnMode) {
      case ReturnMode.RETURN_COUNT:
        return 0
      case ReturnMode.RETURN_ALL_ROWS:
        return [] as any
      case ReturnMode.RETURN_FIRST_ROW:
        return null
      default:
        return null
    }
  }

  const sqlParts: string[] = [`update ${df.sql.tableName} set`]

  const columnNamesToUpdate = fieldNamesToUpdate
    .map(fName => df.sql.cols[fName])

  let columnsAndValuesSql: string
  if (fieldNamesToUpdate.length > 1) {
    const columnsSql = columnNamesToUpdate.join(', ')
    const parametersSql = createParametersString(fieldNamesToUpdate.length)
    // E.g. (name, email) = ($1, $2)
    columnsAndValuesSql = `(${columnsSql}) = (${parametersSql})`
  }
  else {
    // E.g. name = $1
    columnsAndValuesSql = `${columnNamesToUpdate[0]} = $1`
  }

  sqlParts.push(columnsAndValuesSql)

  const queryInfo = createDataQuery(options.query).toSql({
    filterTransformer: node => ({ left: df.sql.cols[node.field] }),
    sortingTransformer: node => ({ left: df.sql.cols[node.field] }),
    parameterStartIndex: fieldNamesToUpdate.length + 1,
  })

  values.push(...queryInfo.values)

  // If there is no OBLO, then we can do a simple form
  if (queryInfo?.orderByLimitOffset == null) {
    sqlParts.push(queryInfo?.where)
  }
  // Else, we need to use ctid and a subquery
  else {
    sqlParts.push('where ctid in (')
    sqlParts.push(`select ctid from ${df.sql.tableName}`)
    sqlParts.push(queryInfo?.where)
    sqlParts.push(queryInfo?.orderByLimitOffset)
    sqlParts.push(')')
  }

  // -- Returning statement
  if (returnMode !== ReturnMode.RETURN_COUNT)
    sqlParts.push('returning *')

  const sql = sqlParts.filter(s => s != null).join('\n')

  const result = await db.query(sql, values)

  switch (returnMode) {
    case ReturnMode.RETURN_COUNT:
      return result.rowCount
    case ReturnMode.RETURN_ALL_ROWS:
      return result.rows.map(row => objectPropsToCamelCase(row)) as any
    case ReturnMode.RETURN_FIRST_ROW:
      return objectPropsToCamelCase(result.rows[0]) as any
    default:
      return result.rowCount
  }
}
