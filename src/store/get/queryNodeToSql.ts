import { createDataFilter } from '@samhuk/data-filter'
import { createDataQuery } from '@samhuk/data-query'
import { DataType } from '../../dataFormat/types'
import { filterForNotNullAndEmpty, concatIfNotNullAndEmpty, joinIfhasEntries } from '../../helpers/string'
import { QueryNode, DataNode } from './types'

type DataNodeQueryInfo = {
  whereClause?: string
  orderByLimitOffset?: string
}

const createRootSelect = (queryNode: QueryNode) => {
  const rootDataNode = queryNode.rootDataNode
  const dataNodeList = Object.values(queryNode.dataNodes)

  // E.g. "0".id "0.id", "0".user_id "0.userId", "1".dateCreated, "1.dateCreated", ...
  const columnsSql = dataNodeList.reduce<string[]>((acc, dataNode) => (
    acc.concat(dataNode.createColumnsSqlSegments())
  ), []).join(', ')

  // E.g. select ... from "user" "0"
  return `select
${columnsSql}
from ${rootDataNode.dataFormat.sql.tableName} ${rootDataNode.tableAlias}`
}

/**
 * Creates a where clause, (E.g. `"0.userId" = 1`) for the given *non-plural* data node.
 * This will take the data node's option's `filter` and use the `data-filter` npm package
 * to create a where clause from it, if it's defined.
 *
 * If the data node does not have any filter, this will return `null`.
 */
const createWhereClauseOfDataNode = (dataNode: DataNode<false>): string | null => {
  const dataFilterNodeOrGroup = dataNode.options.filter
  return dataFilterNodeOrGroup != null
    ? createDataFilter(dataFilterNodeOrGroup)
      .toSql({ transformer: node => ({ left: dataNode.fieldsInfo.fieldToFullyQualifiedColumnName[node.field] }) })
    : null
}

/**
 * Creates query info (a where clause and an order-by-limit-offset statement), for the given
 * *plural* data node. This will take the data node's option's `query` and use the `data-query`
 * npm package to create the query info.
 *
 * If the data node does not have any query, this will return `null`.
 *
 * If the data node has a query, but is missing certain parts of the data query, then the where
 * clause and/or the order-by-limit-offset statement can be null.
 */
const createQueryInfoOfDataNode = (dataNode: DataNode<true>): DataNodeQueryInfo | null => {
  const dataQueryRecord = dataNode.options.query
  if (dataQueryRecord != null) {
    const dataQuerySql = createDataQuery(dataQueryRecord).toSql({
      sortingTransformer: node => ({ left: dataNode.fieldsInfo.fieldToFullyQualifiedColumnName[node.field] }),
      filterTransformer: node => ({ left: dataNode.fieldsInfo.fieldToFullyQualifiedColumnName[node.field] }),
      includeWhereWord: false,
    })
    return {
      whereClause: dataQuerySql.where,
      orderByLimitOffset: dataQuerySql.orderByLimitOffset,
    }
  }
  return null
}

/**
 * Converts all of the non-root (therefore *non-plural*) data nodes within `queryNode` into a
 * series of new-line-separated `left join` sql statements, with each data node's filter applied
 * alongside each left join as a where clause (minus the actual "where" word since joins just
 * need an " and " separator).
 */
const createLeftJoinsSql = (queryNode: QueryNode) => (
  Object.values(queryNode.nonRootDataNodes).map(dataNode => {
    const linkedColumnName = dataNode.dataFormat.sql.columnNames[dataNode.fieldRef.fieldName]
    const parentLinkedColumnName = dataNode.parent.dataFormat.sql.columnNames[dataNode.parentFieldRef.fieldName]
    const whereClause = createWhereClauseOfDataNode(dataNode)
    // E.g. left join "userImage" "1" on "1".user_id = "0".id and "1".date_deleted is not null\n
    return filterForNotNullAndEmpty([
      `left join ${dataNode.dataFormat.sql.tableName} ${dataNode.tableAlias} on ${dataNode.tableAlias}.${linkedColumnName} = ${dataNode.parent.tableAlias}.${parentLinkedColumnName}`,
      whereClause,
    ]).join(' and ')
  }).join('\n'))

const createLinkedFieldWhereClause = (
  queryNode: QueryNode,
  linkedFieldValues: any[] | null,
) => {
  const rootDataNode = queryNode.rootDataNode

  if (rootDataNode.fieldRef == null || linkedFieldValues == null || linkedFieldValues.length === 0)
    return null

  // E.g. "0".creator_user_id
  const linkedFieldColumnSql = rootDataNode.fieldsInfo.fieldToFullyQualifiedColumnName[rootDataNode.fieldRef.fieldName]
  const linkedFieldDataType = rootDataNode.dataFormat.fields[rootDataNode.fieldRef.fieldName].dataType
  // Performance optimization for when there is only one linked field.
  if (linkedFieldValues.length === 1)
    return `${linkedFieldColumnSql} = ${linkedFieldValues[0]}`
  // E.g. 1, 2, 3, 4
  const valuesSql = (linkedFieldDataType === DataType.STRING
    ? linkedFieldValues.map(v => `'${v}'`)
    : linkedFieldValues
  ).join(', ')
  // E.g. "0".creator_user_id in (1, 2, 3)
  return `${linkedFieldColumnSql} in (${valuesSql})`
}

const createDataNodeQueryInfo = (dataNode: DataNode): DataNodeQueryInfo | null => (
  dataNode.isPlural
    ? createQueryInfoOfDataNode(dataNode as DataNode<true>)
    : {
      whereClause: createWhereClauseOfDataNode(dataNode as DataNode<false>),
      orderByLimitOffset: 'limit 1',
    }
)

const createQuerySqlForRootNode = (queryNode: QueryNode, linkedFieldValues: any[] | null): string => {
  const rootNodeQueryInfo = createDataNodeQueryInfo(queryNode.rootDataNode)

  return filterForNotNullAndEmpty([
    concatIfNotNullAndEmpty(
      'where ',
      joinIfhasEntries(
        filterForNotNullAndEmpty([
          createLinkedFieldWhereClause(queryNode, linkedFieldValues),
          rootNodeQueryInfo?.whereClause,
        ]),
        ' and ',
      ),
    ),
    rootNodeQueryInfo?.orderByLimitOffset,
  ]).join(' ')
}

export const queryNodeToSql = (
  queryNode: QueryNode,
  linkedFieldValues: any[] | null,
): string => [
  createRootSelect(queryNode),
  createLeftJoinsSql(queryNode),
  createQuerySqlForRootNode(queryNode, linkedFieldValues),
].join('\n')
