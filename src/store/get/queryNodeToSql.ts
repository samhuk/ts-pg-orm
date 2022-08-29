import { createDataFilter } from '@samhuk/data-filter'
import { createDataQuery } from '@samhuk/data-query'
import { DataType } from '../../dataFormat/types'
import { filterForNotNullAndEmpty, concatIfNotNullAndEmpty, joinIfhasEntries } from '../../helpers/string'
import { RelationType } from '../../relations/types'
import { AnyGetFunctionOptions } from '../types/get'
import { QueryNode, DataNode, QueryNodeSql, QueryNodeToSqlStrategy } from './types'

type DataNodeQueryInfo = {
  whereClause?: string
  orderByLimitOffset?: string
}

const createRootSelect = (queryNode: QueryNode) => {
  const rootDataNode = queryNode.rootDataNode
  const dataNodeList = Object.values(queryNode.dataNodes)

  const columnSegments = dataNodeList.reduce<string[]>((acc, dataNode) => (
    acc.concat(dataNode.createColumnsSqlSegments())
  ), [])

  if (rootDataNode.relation?.type === RelationType.MANY_TO_MANY) {
    const fieldRef1Segment = `"${rootDataNode.fieldsInfo.joinTableAlias}".${rootDataNode.relation.sql.joinTableFieldRef1ColumnName} "${rootDataNode.fieldsInfo.joinTableAlias}.${rootDataNode.relation.sql.joinTableFieldRef1ColumnName}"`
    const fieldRef2Segment = `"${rootDataNode.fieldsInfo.joinTableAlias}".${rootDataNode.relation.sql.joinTableFieldRef2ColumnName} "${rootDataNode.fieldsInfo.joinTableAlias}.${rootDataNode.relation.sql.joinTableFieldRef2ColumnName}"`
    columnSegments.push(fieldRef1Segment, fieldRef2Segment)
  }

  // E.g. "0".id "0.id", "0".user_id "0.userId", "1".dateCreated, "1.dateCreated", ...
  const columnsSql = columnSegments.join(', ')

  let suffix: string
  if (rootDataNode.relation?.type === RelationType.MANY_TO_MANY) {
    const joinTableFullyQualifiedColumnName = rootDataNode.fieldsInfo.joinTableFullyQualifiedColumnName
    /* E.g. from "user_to_user_group" "123"
     * join "user_group" "1" on "1".id = "123".user_group_id
     */
    suffix = `from ${rootDataNode.relation.sql.joinTableName} "${rootDataNode.fieldsInfo.joinTableAlias}"
join ${rootDataNode.dataFormat.sql.tableName} ${rootDataNode.tableAlias} on ${rootDataNode.tableAlias}.${rootDataNode.fieldRef.fieldName} = ${joinTableFullyQualifiedColumnName}`
  }
  else {
    suffix = `from ${rootDataNode.dataFormat.sql.tableName} ${rootDataNode.tableAlias}`
  }

  // E.g. select ... from "user" "0"
  return `select
${columnsSql}
${suffix}`
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

  let suffix: string
  const linkedFieldDataType = rootDataNode.dataFormat.fields[rootDataNode.fieldRef.fieldName].dataType

  // Performance optimization for when there is only one linked field.
  if (linkedFieldValues.length === 1) {
    suffix = linkedFieldDataType === DataType.STRING ? ` = '${linkedFieldValues[0]}'` : ` = ${linkedFieldValues[0]}`
  }
  else {
    // E.g. 1, 2, 3, 4
    const valuesSql = (linkedFieldDataType === DataType.STRING
      ? linkedFieldValues.map(v => `('${v}')`)
      : linkedFieldValues.map(v => `(${v})`)
    ).join(',')
    // E.g. = any (values (1),(2),(3))
    suffix = ` = any (values ${valuesSql})`
  }

  if (rootDataNode.relation.type === RelationType.MANY_TO_MANY) {
    // TODO: Extract all this out to the relation sql info probably
    // TODO: need a way to uniquely and predictably provide an alias for this
    const joinTableNameAlias = `${rootDataNode.relation.sql.joinTableName}`
    const isFieldRefFieldRef1 = rootDataNode.relation.fieldRef1.formatName === rootDataNode.dataFormat.name
    const joinTableColumnName = isFieldRefFieldRef1
      ? rootDataNode.relation.sql.joinTableFieldRef2ColumnName
      : rootDataNode.relation.sql.joinTableFieldRef1ColumnName
    return `"${joinTableNameAlias}".${joinTableColumnName}${suffix}`
  }

  // E.g. "0".creator_user_id
  const linkedFieldColumnSql = rootDataNode.fieldsInfo.fieldToFullyQualifiedColumnName[rootDataNode.fieldRef.fieldName]
  return `${linkedFieldColumnSql}${suffix}`
}

const createDataNodeQueryInfo = (dataNode: DataNode): DataNodeQueryInfo | null => (
  dataNode.isPlural
    ? createQueryInfoOfDataNode(dataNode as DataNode<true>)
    : {
      whereClause: createWhereClauseOfDataNode(dataNode as DataNode<false>),
      orderByLimitOffset: 'limit 1',
    }
)

type RootNodeQuerySqlComponents = {
  queryInfo: DataNodeQueryInfo
  linkedFieldWhereClause: string | null
}

type RootNodeQuerySql = RootNodeQuerySqlComponents & {
  toSql: () => string
}

const createRootNodeQuerySqlComponents = (
  queryNode: QueryNode,
  linkedFieldValues: any[] | null,
): RootNodeQuerySqlComponents => ({
  linkedFieldWhereClause: createLinkedFieldWhereClause(queryNode, linkedFieldValues),
  queryInfo: createDataNodeQueryInfo(queryNode.rootDataNode),
})

const assembleQuerySqlComponents = (
  rootNodeQuerySqlComponents: RootNodeQuerySqlComponents,
): string => filterForNotNullAndEmpty([
  concatIfNotNullAndEmpty(
    'where ',
    joinIfhasEntries(
      filterForNotNullAndEmpty([
        rootNodeQuerySqlComponents.linkedFieldWhereClause,
        rootNodeQuerySqlComponents.queryInfo?.whereClause,
      ]),
      ' and ',
    ),
  ),
  rootNodeQuerySqlComponents.queryInfo?.orderByLimitOffset,
]).join(' ')

const createRootNodeQuerySql = (
  queryNode: QueryNode,
  linkedFieldValues: any[] | null,
): RootNodeQuerySql => {
  let instance: RootNodeQuerySql
  const components = createRootNodeQuerySqlComponents(queryNode, linkedFieldValues)
  return instance = {
    ...components,
    toSql: () => assembleQuerySqlComponents(instance),
  }
}

const determineSqlStrategy = (queryNode: QueryNode) => {
  const pageSize = (queryNode.rootDataNode.options as AnyGetFunctionOptions<true>).query?.pageSize
  const isRowRangeConstrained = pageSize != null && pageSize > 0
  return isRowRangeConstrained ? QueryNodeToSqlStrategy.MULTIPLE_QUERY_WITH_UNION_ALL : QueryNodeToSqlStrategy.SINGLE_QUERY
}

const assembleSql = (rootSelectAndLeftJoinsSqlText: string, rootNodeQuerySql: string) => [
  rootSelectAndLeftJoinsSqlText,
  rootNodeQuerySql,
].join('\n')

export const queryNodeToSql = <TIsPlural extends boolean = boolean>(
  queryNode: QueryNode<TIsPlural>,
  linkedFieldValues: any[] | null,
): QueryNodeSql<TIsPlural> => {
  let queryNodeSql: QueryNodeSql

  const rootSelectAndLeftJoinsSqlText = filterForNotNullAndEmpty([createRootSelect(queryNode), createLeftJoinsSql(queryNode)]).join('\n')

  //  TODO: Use the strat
  const strat = determineSqlStrategy(queryNode)
  const rootNodeQuerySql = createRootNodeQuerySql(queryNode, linkedFieldValues)
  let rootNodeQuerySqlSql = rootNodeQuerySql.toSql()

  const updateSql = () => queryNodeSql.sql = assembleSql(rootSelectAndLeftJoinsSqlText, rootNodeQuerySqlSql)

  return queryNodeSql = {
    sql: assembleSql(rootSelectAndLeftJoinsSqlText, rootNodeQuerySqlSql),
    updateLinkedFieldValues: (newLinkedFieldValues: any[] | null) => {
      rootNodeQuerySql.linkedFieldWhereClause = createLinkedFieldWhereClause(queryNode, newLinkedFieldValues)
      rootNodeQuerySqlSql = rootNodeQuerySql.toSql()
      updateSql()
    },
    modifyRootDataNodeDataFilter: newDataFilter => {
      if (queryNode.rootDataNode.isPlural)
        throw new Error('Cannot update root data node data filter, it is plural. Try calling modifyRootDataNodeDataQuery().')

      const _nonPluralRootDataNode = queryNode.rootDataNode as DataNode<false>
      _nonPluralRootDataNode.options.filter = newDataFilter
      rootNodeQuerySql.queryInfo = createDataNodeQueryInfo(_nonPluralRootDataNode)
      rootNodeQuerySqlSql = rootNodeQuerySql.toSql()
      updateSql()
    },
    modifyRootDataNodeDataQuery: newDataQuery => {
      if (!queryNode.rootDataNode.isPlural)
        throw new Error('Cannot update root data node data query, it is non-plural. Try calling modifyRootDataNodeDataFilter().')

      const _pluralRootDataNode = queryNode.rootDataNode as DataNode<true>
      _pluralRootDataNode.options.query = newDataQuery
      rootNodeQuerySql.queryInfo = createDataNodeQueryInfo(_pluralRootDataNode)
      rootNodeQuerySqlSql = rootNodeQuerySql.toSql()
      updateSql()
    },
  }
}
