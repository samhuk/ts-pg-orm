/**
 * Creates a "$1, $2, $3" parameters sql string
 */
export const createParametersString = (numColumns: number): string => {
  const parametersStringItems: string[] = []
  for (let i = 1; i <= numColumns; i += 1)
    parametersStringItems.push(`$${i}`)
  return parametersStringItems.join(', ')
}

export const createInsertReturningSql = (tableName: string, columnNames: string[]) => {
  const columnNamesSql = columnNames.join(', ')
  const parametersSql = createParametersString(columnNames.length)
  return (
    `with cte as (
  insert into ${tableName}
  (${columnNamesSql})
  values (${parametersSql})
  returning *
) select * from cte`
  )
}
