import { createDataQuery } from '@samhuk/data-query'
import { SimplePgClient } from 'simple-pg-client/dist/types'
import { DataFormat } from '../../dataFormat/types'
import { objectPropsToCamelCase } from '../../helpers/string'
import { ReturnModeRaw, ReturnMode } from '../common/types'
import { DeleteFunctionOptions, DeleteFunctionResult } from './types'

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

export const deleteBase = async (
  db: SimplePgClient,
  tableName: string,
  fieldToColumnNameMap: { [fieldName: string]: string },
  options?: DeleteFunctionOptions,
): Promise<DeleteFunctionResult> => {
  const sqlParts: string[] = [`delete from ${tableName}`]

  const queryInfo = options?.query != null
    ? createDataQuery(options?.query).toSql({
      filterTransformer: node => ({ left: fieldToColumnNameMap[node.field] }),
      sortingTransformer: node => ({ left: fieldToColumnNameMap[node.field] }),
    })
    : null

  // If there is no OBLO, then we can do a simple form
  if (queryInfo?.orderByLimitOffset == null) {
    sqlParts.push(queryInfo?.where)
  }
  // Else, we need to use ctid and a subquery
  else {
    sqlParts.push('where ctid in (')
    sqlParts.push(`select ctid from ${tableName}`)
    sqlParts.push(queryInfo?.where)
    sqlParts.push(queryInfo?.orderByLimitOffset)
    sqlParts.push(')')
  }

  // -- Returning statement
  const returnMode = determineReturnMode(options?.return)
  if (returnMode !== ReturnMode.RETURN_COUNT)
    sqlParts.push('returning *')

  const sql = sqlParts.filter(s => s != null).join('\n')

  const result = await db.query(sql)

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

export const _delete = (
  db: SimplePgClient,
  df: DataFormat,
  options?: DeleteFunctionOptions,
): Promise<DeleteFunctionResult> => deleteBase(
  db,
  df.sql.tableName,
  df.sql.columnNames,
  options,
)
