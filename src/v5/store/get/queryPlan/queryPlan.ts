import { SimplePgClient } from 'simple-pg-client/dist/types'
import { setObjPropDeep, readObjPropDeep } from '../../../../common/obj'
import { removeDuplicates, removeNullAndUndefinedValues } from '../../../../helpers/array'
import { deepRemovePropsWithPrefix } from '../../../../helpers/object'
import { DataFormat, DataFormats } from '../../../dataFormat/types'
import { Relations, RelationType } from '../../../relations/types'
import { GetFunctionOptions } from '../types'
import { toDataNodes } from './dataNodes'
import { toQueryNodes } from './queryNodes'
import { QueryNode, QueryNodeSql, DataNode, QueryNodes, QueryPlan } from './types'

const createQueryNodeSql = (
  queryNode: QueryNode,
  linkedFieldValues: any[] | null,
  queryNodeSqlDict: { [queryNodeId: number]: QueryNodeSql },
): string => {
  /* Try and find any pre-existing QueryNodeSql for the current node.
   * If it exists, update the linked field values-dependant part of it
   * and then return the SQL text.
   */
  const preExistingQueryNodeSql = queryNodeSqlDict[queryNode.id]
  if (preExistingQueryNodeSql != null) {
    preExistingQueryNodeSql.updateLinkedFieldValues(linkedFieldValues)
    return preExistingQueryNodeSql.sql
  }

  /* Else (if pre-existing QueryNodeSql does not exist), then convert
   * the current Query Node to QueryNodeSql, store that on the state dict,
   * and return the SQL text.
   */
  const queryNodeSqlObj = queryNode.toSql(linkedFieldValues)
  queryNodeSqlDict[queryNode.id] = queryNodeSqlObj
  return queryNodeSqlObj.sql
}

/**
 * Creates a dict that maps linked field name to the unique values for it,
 * for the given Query Node.
 *
 * These linked field values will be consumed by child Query Nodes of the given
 * Query Node, to retrieve the related data.
 */
const createLinkedFieldToValuesDict = (
  queryNode: QueryNode,
  rows: any[],
): { linkedFieldToValuesDict: { [fieldName: string]: any[] }, linkIndexToLinkedField: string[] } => {
  const linkedFieldToValuesDict: { [fieldName: string]: any[] } = {}
  const linkIndexToLinkedField = queryNode.childQueryNodeLinks.map(link => (
    link.childQueryNode.rootDataNode.parentFieldRef.field
  ))
  queryNode.childQueryNodeLinks.forEach((link, i) => {
    const linkedField = linkIndexToLinkedField[i]
    // If the linked field values haven't been computed yet, then compute and add them to the dict
    if (linkedFieldToValuesDict[linkedField] == null) {
      const linkedFieldColumnSql = `${link.sourceDataNode.id}.${link.sourceDataNode.dataFormat.sql.cols[linkedField]}`
      linkedFieldToValuesDict[linkedField] = removeDuplicates(removeNullAndUndefinedValues(rows.map(row => row[linkedFieldColumnSql])))
    }
  })
  return { linkedFieldToValuesDict, linkIndexToLinkedField }
}

const executeQueryNode = async (
  db: SimplePgClient,
  queryNode: QueryNode,
  results: { [queryNodeId: string]: any[] },
  linkedFieldValues: any[] | null,
  queryNodeSqlDict: { [queryNodeId: number]: QueryNodeSql },
): Promise<{ [queryNodeId: number]: any[] }> => {
  /* Create sql for query node, using the linked field values received from
   * the parent query node results.
   */
  const queryNodeSql = createQueryNodeSql(queryNode, linkedFieldValues, queryNodeSqlDict)
  // Execute sql with db service
  const _rows: any[] = await db.queryGetRows(queryNodeSql)
  const rows = _rows ?? []
  // Store the results in the state object
  results[queryNode.id] = rows
  /* If there was no data retreived for this query node, then we don't need to
   * proceed with getting child query node data (there will be no linked field values).
   */
  if (rows.length === 0 || queryNode.childQueryNodeLinks.length === 0)
    return results

  /* Create a dict that maps linked field name to the unique values for it.
   * We do this since multiple child query node links can use the same linked
   * field values, and we don't want to recompute them multiple times.
   */
  const { linkedFieldToValuesDict, linkIndexToLinkedField } = createLinkedFieldToValuesDict(queryNode, rows)
  /* Iterate through each child query node link, executing it with the linked field values
   * that correspond to that child query node.
   */
  await Promise.all(queryNode.childQueryNodeLinks.map((link, i) => (
    executeQueryNode(db, link.childQueryNode, results, linkedFieldToValuesDict[linkIndexToLinkedField[i]], queryNodeSqlDict)
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
  /* If the relation type is many-to-many to *this* data node, then the join table parent
   * field values are needed for result folding, but not in the final result, so we designate
   * them as such with the usual '$$'.
   */
  if (dataNode.relation?.type === RelationType.MANY_TO_MANY) {
    const columnAlias = dataNode.fieldsInfo.joinTableParentColumnNameAlias
    result[`$$${columnAlias}`] = row[columnAlias]
  }
  return result
}

/**
 * ### Summary
 *
 * Determine if linked field values match. If they don't, then it means that
 * `linkedFieldColumnAlias` is null when `parentLinkedFieldColumnAlias` isn't,
 * and so the left join did not yield a defined related data record.
 *
 * ### In-depth Explanation:
 *
 * We only need to do this because most databases made the very idiotic decision
 * to make `NULL` mean two things: A literal, *actual* null column value, and the
 * *lack* (being missing) of a value when a LEFT JOIN fails to find a linked row.
 *
 * So what we need do to work around this is make sure we include columns of
 * *both* sides of all LEFT JOINS in the SELECT query for a Query Node. Then when
 * the results come in, if the local side of the LEFT JOIN is not null but the
 * foreign side of it is, then we know *for sure* that there was no linked row,
 * (instead of a linked row but has actual null values).
 *
 * If databases instead had a unique value for a missing value (i.e. "UNDEFINED"),
 * then we wouldn't need to do this, and instead we could just check the first
 * field value of a linked row for if it's missing or not. This is essentially
 * one of the reasons why languages like Javascript have `undefined`.
 *
 * Now, with PostgreSQL being a relational database, we really *shouldn't* be
 * ever getting into this scenario where, say, a recipe has "creator_user_id"
 * 5, and there isn't actually a user with id 5. That relation would be enforced
 * by foreign keys created by ts-pg-orm's Data Format to-sql system. But we still
 * need to control for this, as perhaps in the future, ts-pg-orm will allow
 * relations that aren't *actually* enforced by foreign keys, i.e. a recipe
 * can have whatever "creator_user_id" value it wants.
 */
const determineIfRowWasActuallyFound = (
  dataNode: DataNode,
  row: any,
) => {
  const parentLinkedFieldColumnAlias = dataNode.parent.fieldsInfo.fieldToColumnNameAlias[dataNode.parentFieldRef.field]
  const linkedFieldColumnAlias = dataNode.fieldsInfo.fieldToColumnNameAlias[dataNode.fieldRef.field]
  return row[parentLinkedFieldColumnAlias] === row[linkedFieldColumnAlias]
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
    if (!determineIfRowWasActuallyFound(dataNode, row))
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
      const linkedFieldName = rootDataNodeOfChildQueryNode.parentFieldRef.field
      let childLinkedFieldName: string
      if (rootDataNodeOfChildQueryNode.relation.type === RelationType.MANY_TO_MANY)
        childLinkedFieldName = `$$${rootDataNodeOfChildQueryNode.fieldsInfo.joinTableParentColumnNameAlias}`
      else
        childLinkedFieldName = rootDataNodeOfChildQueryNode.fieldRef.field

      const relatedDataPropNamePath = []
      let currentDataNode = rootDataNodeOfChildQueryNode
      while (currentDataNode != null) {
        relatedDataPropNamePath.push(currentDataNode.relatedDataPropName)
        if (currentDataNode.parent !== queryNode.rootDataNode)
          currentDataNode = currentDataNode.parent
        else
          currentDataNode = null
      }
      relatedDataPropNamePath.reverse()
      const relatedDataPropParentObjPath = relatedDataPropNamePath.slice(0)
      relatedDataPropParentObjPath.pop()

      // Filter for child values that join to this row
      setObjPropDeep(row, relatedDataPropNamePath, rootDataNodeOfChildQueryNode.isPlural
        ? foldedChildQueryNodeResults.filter(childRow => {
          const rowLinkedDataObj = readObjPropDeep(row, relatedDataPropParentObjPath)
          // Determine the linked field value of this row. It could be prefixed with the removal tag.
          const linkedFieldValue = linkedFieldName in row
            ? rowLinkedDataObj[linkedFieldName]
            : rowLinkedDataObj[`$$${linkedFieldName}`]
          // Determine the linked field value of the child row. It could be prefixed with the removal tag.
          const childLinkedFieldValue = childLinkedFieldName in childRow
            ? childRow[childLinkedFieldName]
            : childRow[`$$${childLinkedFieldName}`]
          // This child row should be included if it's linked value matches this row's linked value
          return linkedFieldValue === childLinkedFieldValue
        })
        : foldedChildQueryNodeResults, true)
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
): any[] => (
  queryNode.rootDataNode.isPlural
    ? queryNodeIdToResultsDict[queryNode.id]?.map(row => foldResultsRowIteration(queryNode, queryNodeIdToResultsDict, row)) ?? []
    : queryNodeIdToResultsDict[queryNode.id][0] != null
      ? foldResultsRowIteration(queryNode, queryNodeIdToResultsDict, queryNodeIdToResultsDict[queryNode.id][0])
      : null
)

const execute = async (
  db: SimplePgClient,
  queryNodes: QueryNodes,
  rootQueryNode: QueryNode,
  queryNodeSqlDict: { [queryNodeId: number]: QueryNodeSql },
): Promise<any> => {
  // Recursively get the flat rows of data for each query node using db service
  const queryNodeIdToFlatResultsDict = await executeQueryNode(db, rootQueryNode, {}, null, queryNodeSqlDict)
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

/**
 * Creates a query plan from the given data formats, relations, and other options.
 *
 * Using the data formats and relations, a query plan transforms the given `options`
 * into a graph-like data structure - "query nodes" - that define what queries will
 * need to be made to get the desired data according to those `options`.
 *
 * NOTE: The return type of `execute()` does not work correctly when defining `fields`,
 * `filter`, or `query` on child relations within `options`. It is unknown why, but
 * likely has something to do with the generics of `createQueryPlan`. Since
 * `createQueryPlan` isn't really a user-facing function (it is instead wrapped by
 * `getSingle()` and `getMultiple` of a `TsPgOrm` instance), and the return type of
 * those functions *do* work correctly, this isn't too much of a concern.
 */
export const createQueryPlan = <
  TDataFormats extends DataFormats = DataFormats,
  TRelations extends Relations = Relations,
  TLocalDataFormat extends DataFormat = DataFormat,
  TIsPlural extends boolean = boolean,
  TOptions extends GetFunctionOptions<TDataFormats, TRelations, TLocalDataFormat, TIsPlural> =
    GetFunctionOptions<TDataFormats, TRelations, TLocalDataFormat, TIsPlural>,
>(
    relations: TRelations,
    dataFormats: TDataFormats,
    dataFormat: TLocalDataFormat,
    isPlural: TIsPlural,
    options: TOptions,
  ): QueryPlan<TDataFormats, TRelations, TLocalDataFormat, TIsPlural, TOptions> => {
  // Create data nodes, converting the recursive options object into a graph
  const dataNodes = toDataNodes(relations, dataFormats, dataFormat, isPlural, options)
  // Create query nodes, grouping data nodes together into single queries
  const queryNodes = toQueryNodes(dataNodes)
  // Determine the root query node (the one that has no parent query node)
  const rootQueryNode = Object.values(queryNodes).find(queryNode => (
    queryNode.parentQueryNodeLink == null
  ))

  // Memoized sql fragments of each query node. For performance when re-executing the query plan.
  const queryNodeSqlDict: { [queryNodeId: number]: QueryNodeSql } = {}

  return {
    dataNodes,
    queryNodes,
    rootQueryNode,
    execute: async db => execute(db, queryNodes, rootQueryNode, queryNodeSqlDict),
    modifyRootDataFilter: newDataFilter => {
      if (rootQueryNode.rootDataNode.isPlural)
        throw new Error('Cannot update root data filter, it is plural. Try calling modifyRootDataQuery().')

      const rootQueryNodeSql = queryNodeSqlDict[rootQueryNode.id] as QueryNodeSql<false>
      if (rootQueryNodeSql != null)
        rootQueryNodeSql.modifyRootDataNodeDataFilter(newDataFilter)
      else
        (rootQueryNode.rootDataNode as DataNode<false>).options.filter = newDataFilter
    },
    modifyRootDataQuery: newDataQuery => {
      if (!rootQueryNode.rootDataNode.isPlural)
        throw new Error('Cannot update root data query, it is non-plural. Try calling modifyRootDataFilter().')

      const rootQueryNodeSql = queryNodeSqlDict[rootQueryNode.id] as QueryNodeSql<true>
      if (rootQueryNodeSql != null)
        rootQueryNodeSql.modifyRootDataNodeDataQuery(newDataQuery)
      else
        (rootQueryNode.rootDataNode as DataNode<true>).options.query = newDataQuery
    },
  }
}
