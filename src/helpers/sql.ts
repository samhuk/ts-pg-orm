/**
 * Creates a "$1, $2, $3" parameters sql string.
 *
 * @example
 * createParametersString(3) -> '$1, $2, $3'
 */
export const createParametersString = (numColumns: number): string => {
  const parametersStringItems: string[] = []
  for (let i = 1; i <= numColumns; i += 1)
    parametersStringItems.push(`$${i}`)
  return parametersStringItems.join(', ')
}

/**
 * @example
 * createInsertReturningSql('"user"', ['name', 'eamil'])
 * /* with cte as (
 *  *   insert into "user"
 *  *   ("name", "email")
 *  *   values ($1, $2)
 *  *   returning *
 *  * ) select * from cte
 *  *\/
 */
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
