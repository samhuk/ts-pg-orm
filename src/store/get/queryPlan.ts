import { SimplePgClient } from 'simple-pg-client/dist/types'
import { DataFormat, DataFormatDeclarations, DataFormatsDict } from '../../dataFormat/types'
import { removeDuplicates } from '../../helpers/array'
import { deepRemovePropsWithPrefix } from '../../helpers/object'
import { RelationDeclarations, RelationsDict } from '../../relations/types'
import { GetFunctionOptions } from '../types/get'
import { toDataNodes } from './dataNodes'
import { toQueryNodes } from './queryNodes'
import { DataNode, QueryNode, QueryNodes, QueryPlan } from './types'

const executeQueryNode = async (
  db: SimplePgClient,
  queryNode: QueryNode,
  results: { [queryNodeId: string]: any[] },
  linkedFieldValues: any[] | null,
): Promise<{ [queryNodeId: number]: any[] }> => {
  /* Create sql for query node, using the linked field values received from
   * the parent query node results.
   */
  const sql = queryNode.toSql(linkedFieldValues)
  // Execute sql with db service
  const _rows: any[] = await db.queryGetRows(sql)
  const rows = _rows ?? []
  // Store the results in the state object
  results[queryNode.id] = rows
  /* If there was no data retreived for this query node, then we don't need to
   * proceed with getting child query node data (there will be no linked field values).
   */
  if (rows.length === 0 || queryNode.childQueryNodeLinks.length === 0)
    return null
  /* Create a dict that maps linked field name to the unique values for it.
   * We do this since multiple child query node links can use the same linked
   * field values, and we don't want to recompute them multiple times.
   */
  const linkedFieldToValuesDict: { [fieldName: string]: any[] } = {}
  const linkIndexToLinkedField = queryNode.childQueryNodeLinks.map(link => (
    link.childQueryNode.rootDataNode.parentFieldRef.fieldName
  ))
  queryNode.childQueryNodeLinks.forEach((link, i) => {
    const linkedField = linkIndexToLinkedField[i]
    // If the linked field values haven't been computed yet, then compute and add them to the dict
    if (linkedFieldToValuesDict[linkedField] == null) {
      const linkedFieldColumnSql = `${link.sourceDataNode.id}.${link.sourceDataNode.dataFormat.sql.columnNames[linkedField]}`
      linkedFieldToValuesDict[linkedField] = removeDuplicates(rows.map(row => row[linkedFieldColumnSql]))
    }
  })
  /* Iterate through each child query node link, executing it with the linked field values
   * that correspond to that child query node.
   */
  await Promise.all(queryNode.childQueryNodeLinks.map((link, i) => (
    executeQueryNode(db, link.childQueryNode, results, linkedFieldToValuesDict[linkIndexToLinkedField[i]])
  )))
  return results
}

const extractDataNodeDataFromRow = (
  row: any,
  dataNode: DataNode,
  includeFieldsUsedOnlyForRelations: boolean,
) => {
  // Convert column-aliased results to results using conversion dict of data node
  const result: any = {}
  dataNode.fieldsInfo.fieldsToKeepInRecord.forEach(fName => {
    result[fName] = row[dataNode.fieldsInfo.fieldToColumnNameAlias[fName]]
  })
  /* If we should include fields only used for relations (not to keep in the final data),
   * then we will prepend these ones with '$$' so that they can be sanitized away later.
   */
  if (includeFieldsUsedOnlyForRelations) {
    dataNode.fieldsInfo.fieldsOnlyUsedForRelations.forEach(fName => {
      result[`$$${fName}`] = row[dataNode.fieldsInfo.fieldToColumnNameAlias[fName]]
    })
  }
  return result
}

const rowToDataNodeData = (
  queryNode: QueryNode,
  dataNode: DataNode,
  row: any,
) => {
  const isRootDataNode = dataNode === queryNode.rootDataNode
  /* Determine if we need to check if this dataNode's part of the queryNode's
   * row was actually found. We do this by comparing linked field values.
   */
  if (dataNode.parent != null && !isRootDataNode) {
    /* Determine if linked field values match. If they don't, then it means that
    * `linkedFieldColumnAlias` is null when parentLinkedFieldColumnAlias isn't,
    * and so the left join did not yield a defined related data record.
    */
    const parentLinkedFieldColumnAlias = dataNode.parent.fieldsInfo.fieldToColumnNameAlias[dataNode.parentFieldRef.fieldName]
    const linkedFieldColumnAlias = dataNode.fieldsInfo.fieldToColumnNameAlias[dataNode.fieldRef.fieldName]
    const doLinkedValuesMatch = row[parentLinkedFieldColumnAlias] === row[linkedFieldColumnAlias]
    if (!doLinkedValuesMatch)
      return null
  }

  /* Determine if this dataNode's part of the queryNode's row needs to include any
   * field values that are only required for relations. This will be used later to
   * fold up each queryNode's results.
   */
  const shouldIncludeFieldsUsedOnlyForRelations = (
    (queryNode.parentQueryNodeLink != null && isRootDataNode)
    || (queryNode.childQueryNodeLinks.some(link => link.sourceDataNode === dataNode))
  )
  // Extract this dataNode's data from the queryNode's row
  const data = extractDataNodeDataFromRow(row, dataNode, shouldIncludeFieldsUsedOnlyForRelations)
  // Repeat for all child data nodes of the queryNode
  Object.values(dataNode.children)
    .filter(childDataNode => queryNode.dataNodes[childDataNode.id] != null)
    .forEach(childDataNode => {
      data[childDataNode.relatedDataPropName] = rowToDataNodeData(queryNode, childDataNode, row)
    })
  return data
}

const foldQueryNodeResults = (
  queryNode: QueryNode,
  queryNodeResults: any[],
) => queryNodeResults.map(row => rowToDataNodeData(queryNode, queryNode.rootDataNode, row))

const foldResultsRowIteration = (
  queryNode: QueryNode,
  queryNodeIdToResultsDict: { [queryNodeId: number]: any[] },
  row: any,
) => {
  queryNode.childQueryNodeLinks.forEach(childQueryNodeLink => {
    const childQueryNode = childQueryNodeLink.childQueryNode
    const rootDataNodeOfChildQueryNode = childQueryNode.rootDataNode
    const childQueryNodeResults = queryNodeIdToResultsDict[childQueryNode.id]
    if (childQueryNodeResults != null) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      const foldedChildQueryNodeResults = foldResults(childQueryNode, queryNodeIdToResultsDict)
      const linkedFieldName = rootDataNodeOfChildQueryNode.parentFieldRef.fieldName
      const childLinkedFieldName = rootDataNodeOfChildQueryNode.fieldRef.fieldName
      row[rootDataNodeOfChildQueryNode.relatedDataPropName] = rootDataNodeOfChildQueryNode.isPlural
        ? foldedChildQueryNodeResults.filter(childRow => {
          const linkedFieldValue = linkedFieldName in row
            ? row[linkedFieldName]
            : row[`$$${linkedFieldName}`]
          const childLinkedFieldValue = childLinkedFieldName in childRow
            ? childRow[childLinkedFieldName]
            : childRow[`$$${childLinkedFieldName}`]
          return linkedFieldValue === childLinkedFieldValue
        })
        : foldedChildQueryNodeResults
    }
    else {
      row[rootDataNodeOfChildQueryNode.relatedDataPropName] = rootDataNodeOfChildQueryNode.isPlural ? [] : null
    }
  })
  return row
}

const foldResults = (
  queryNode: QueryNode,
  queryNodeIdToResultsDict: { [queryNodeId: number]: any[] },
): any[] => (queryNode.rootDataNode.isPlural
  ? queryNodeIdToResultsDict[queryNode.id]?.map(row => foldResultsRowIteration(queryNode, queryNodeIdToResultsDict, row)) ?? []
  : foldResultsRowIteration(queryNode, queryNodeIdToResultsDict, queryNodeIdToResultsDict[queryNode.id][0]))

const execute = async (
  db: SimplePgClient,
  queryNodes: QueryNodes,
  rootQueryNode: QueryNode,
): Promise<any> => {
  // Recursively get the flat rows of data for each query node using db service
  const queryNodeIdToFlatResultsDict = await executeQueryNode(db, rootQueryNode, {}, null)
  // Fold up each query node's data nodes' results
  const queryNodeIdToResultsDict: { [queryNodeId: number]: any[] } = {}
  Object.entries(queryNodeIdToFlatResultsDict).forEach(([queryNodeId, flatResults]) => {
    const queryNodeIdNumber = parseInt(queryNodeId)
    queryNodeIdToResultsDict[queryNodeIdNumber] = foldQueryNodeResults(queryNodes[queryNodeIdNumber], flatResults)
  })
  // Fold up all folded-up query node results into one result array or object
  const foldedResults = foldResults(rootQueryNode, queryNodeIdToResultsDict)
  // Remove fields only used for relations that shouldn't be in the final results, i.e. "$$fieldName" props
  deepRemovePropsWithPrefix(foldedResults, '$$')
  return foldedResults
}

export const createQueryPlan = <
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number],
  TIsPlural extends boolean,
  TOptions extends GetFunctionOptions<T, K, L, TIsPlural>,
>(
    relations: RelationsDict<T, K>,
    dataFormats: DataFormatsDict<T>,
    dataFormat: DataFormat<L>,
    isPlural: TIsPlural,
    options: TOptions,
  ): QueryPlan<T, K, L, TIsPlural, TOptions> => {
  // Create data nodes, converting the recursive options object into a graph
  const dataNodes = toDataNodes(relations, dataFormats, dataFormat, isPlural, options)
  // Create query nodes, grouping data nodes together into single queries
  const queryNodes = toQueryNodes(dataNodes)
  // Determine the root query node (the one that has no parent query node)
  const rootQueryNode = Object.values(queryNodes).find(queryNode => (
    queryNode.parentQueryNodeLink == null
  ))

  return {
    dataNodes,
    queryNodes,
    rootQueryNode,
    execute: async db => execute(db, queryNodes, rootQueryNode),
  }
}
