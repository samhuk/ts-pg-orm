import { createDataFilter } from '@samhuk/data-filter'
import { createDataQuery } from '@samhuk/data-query'
import { filterForNotNullAndEmpty } from '../../../helpers/string'
import { DataType } from '../../../dataFormat/types/dataType'
import { RelationType, Relation } from '../../../relations/types'
import { isDataNodePlural } from './dataNodes'
import { QueryNode, DataNode, QueryNodeSql } from './types'

type DataNodeQueryInfo = {
  whereClause?: string
  orderByLimitOffset?: string
  values: any[]
}

const isQueryNodeRangeConstrained = (queryNode: QueryNode) => {
  if (!isDataNodePlural(queryNode.rootDataNode))
    return false

  const pageSize = queryNode.rootDataNode.options.query?.pageSize
  return pageSize != null && pageSize > 0
}

/**
 * Creates a where clause, (E.g. `"0.userId" = 1`) for the given *non-plural* data node.
 * This will take the data node's option's `filter` and use the `data-filter` npm package
 * to create a where clause from it, if it's defined.
 *
 * If the data node does not have any filter, this will return `null`.
 */
const createWhereClauseOfDataNode = (dataNode: DataNode<false>, parameterStartIndex: number): { sql: string | null, values: any[] } | null => {
  const dataFilterNodeOrGroup = dataNode.options.filter
  return dataFilterNodeOrGroup != null
    ? createDataFilter(dataFilterNodeOrGroup)
      .toSql({
        transformer: node => ({ left: dataNode.fieldsInfo.fieldToFullyQualifiedColumnName[node.field] }),
        parameterStartIndex,
      })
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
const createQueryInfoOfDataNode = (dataNode: DataNode<true>, parameterStartIndex: number): DataNodeQueryInfo | null => {
  const dataQueryRecord = dataNode.options.query
  if (dataQueryRecord != null) {
    const dataQuerySql = createDataQuery(dataQueryRecord).toSql({
      sortingTransformer: node => ({ left: dataNode.fieldsInfo.fieldToFullyQualifiedColumnName[node.field] }),
      filterTransformer: node => ({ left: dataNode.fieldsInfo.fieldToFullyQualifiedColumnName[node.field] }),
      includeWhereWord: false,
      parameterStartIndex,
    })
    return {
      whereClause: dataQuerySql.where,
      orderByLimitOffset: dataQuerySql.orderByLimitOffset,
      values: dataQuerySql.values,
    }
  }
  return null
}

const createDataNodeQueryInfo = (dataNode: DataNode, parameterStartIndex: number): DataNodeQueryInfo | null => {
  if (dataNode.isPlural)
    return createQueryInfoOfDataNode(dataNode as DataNode<true>, parameterStartIndex)

  const whereClause = createWhereClauseOfDataNode(dataNode as DataNode<false>, parameterStartIndex)

  return {
    whereClause: whereClause?.sql,
    orderByLimitOffset: 'limit 1',
    values: whereClause?.values ?? [],
  }
}

/**
 * Converts all of the non-root (therefore *non-plural*) data nodes within `queryNode` into a
 * series of new-line-separated `left join` sql statements, with each data node's filter applied
 * alongside each left join as a where clause (minus the actual "where" word since joins just
 * need an " and " separator).
 */
const createLeftJoinsSql = (queryNode: QueryNode, parameterStartIndex: number): { sql: string, values: any[] } => {
  const values: any[] = []
  let _parameterStartIndex = parameterStartIndex

  const sql = Object.values(queryNode.nonRootDataNodes).map(dataNode => {
    const linkedColumnName = dataNode.dataFormat.sql.cols[dataNode.fieldRef.field]
    const parentLinkedColumnName = dataNode.parent.dataFormat.sql.cols[dataNode.parentFieldRef.field]
    const whereClause = createWhereClauseOfDataNode(dataNode, _parameterStartIndex)
    if (whereClause != null) {
      _parameterStartIndex += whereClause.values.length
      values.push(...whereClause.values)
    }
    // E.g. left join "userImage" "1" on "1"."user_id" = "0"."id" and "1"."date_deleted" is not null\n
    return filterForNotNullAndEmpty([
      `left join ${dataNode.dataFormat.sql.tableName} ${dataNode.tableAlias} on ${dataNode.tableAlias}.${linkedColumnName} = ${dataNode.parent.tableAlias}.${parentLinkedColumnName}`,
      whereClause?.sql,
    ]).join(' and ')
  }).join('\n')

  return { sql, values }
}

const createLinkedFieldWhereClause = (
  queryNode: QueryNode,
  linkedFieldValues: any[] | null,
) => {
  const rootDataNode = queryNode.rootDataNode

  if (rootDataNode.fieldRef == null || linkedFieldValues == null || linkedFieldValues.length === 0)
    return null

  const isRangeConstrained = isQueryNodeRangeConstrained(queryNode) && linkedFieldValues?.length > 0

  // -- Linked field values equality clause suffix
  let linkedFieldValuesEqualityClause: string
  const linkedFieldDataType = rootDataNode.dataFormat.fields[rootDataNode.fieldRef.field].type

  // Performance optimization for when there is only one linked field.
  if (linkedFieldValues.length === 1) {
    // E.g. = 1
    linkedFieldValuesEqualityClause = linkedFieldDataType === DataType.STR ? ` = '${linkedFieldValues[0]}'` : ` = ${linkedFieldValues[0]}`
  }
  else {
    // E.g. (1),(2),(3),(4)
    const valuesSql = (linkedFieldDataType === DataType.STR
      ? linkedFieldValues.map(v => `('${v}')`)
      : linkedFieldValues.map(v => `(${v})`)
    ).join(',')
    // E.g. = any (values (1),(2),(3))
    linkedFieldValuesEqualityClause = ` = any (values ${valuesSql})`
  }

  // -- Linked field column sql prefix
  let linkedFieldColumnSql: string

  if (isRangeConstrained) {
    const parentLinkedColumnName = rootDataNode.parent.dataFormat.sql.cols[rootDataNode.parentFieldRef.field]
    // E.g. "_0"."id"
    linkedFieldColumnSql = `"_${rootDataNode.parent.unquotedTableAlias}".${parentLinkedColumnName}`
  }
  else if (rootDataNode.relation?.type === RelationType.MANY_TO_MANY) {
    // E.g. "u2ug"."user_id"
    linkedFieldColumnSql = rootDataNode.fieldsInfo.joinTableParentFullyQualifiedColumnName
  }
  else {
    // E.g. "0".creator_user_id
    linkedFieldColumnSql = rootDataNode.fieldsInfo.fieldToFullyQualifiedColumnName[rootDataNode.fieldRef.field]
  }

  // E.g. "0".creator_user_id = any (values (1),(2),(3))
  return `${linkedFieldColumnSql}${linkedFieldValuesEqualityClause}`
}

export const toSql = (queryNode: QueryNode, linkedFieldValues: any[]) => {
  const isManyToMany = queryNode.rootDataNode.relation?.type === RelationType.MANY_TO_MANY
  const isRangeConstrained = isQueryNodeRangeConstrained(queryNode) && linkedFieldValues?.length > 0
  const values: any[] = []
  let parameterStartIndex = 1

  const sqlParts: string[] = ['select']

  // ----------------------------------------------------------------------------------
  // -- Root data node columns (including root data node linked field column sql)
  // ----------------------------------------------------------------------------------
  const columnSegmentsLines: string[] = []
  const rootDataNode = queryNode.rootDataNode
  // E.g. ["0".id "0.id", "0".name "0.name", "0".email "0.email"]
  columnSegmentsLines.push(rootDataNode.createColumnsSqlSegments().join(', '))

  // ----------------------------------------------------------------------------------
  // -- Root data node join table columns
  // ----------------------------------------------------------------------------------
  if (isManyToMany) {
    let fieldRef1ColumnSegment: string
    let fieldRef2ColumnSegment: string
    const rootDataNodeRelationSql = (rootDataNode.relation as Relation<RelationType.MANY_TO_MANY>).sql

    // If query node is range constrained, then the join tables are within the lateral join, accessible from the root data node table alias.
    if (isRangeConstrained) {
      // E.g. "0"."u2ug.user_id" "u2ug.user_id"
      fieldRef1ColumnSegment = `${rootDataNode.tableAlias}."${rootDataNode.fieldsInfo.joinTableAlias}.${rootDataNodeRelationSql.unquotedJoinTableFieldRef1ColumnName}" "${rootDataNode.fieldsInfo.joinTableAlias}.${rootDataNodeRelationSql.unquotedJoinTableFieldRef1ColumnName}"`
      // E.g. "0"."u2ug.user_group_id" "u2ug.user_group_id"
      fieldRef2ColumnSegment = `${rootDataNode.tableAlias}."${rootDataNode.fieldsInfo.joinTableAlias}.${rootDataNodeRelationSql.unquotedJoinTableFieldRef2ColumnName}" "${rootDataNode.fieldsInfo.joinTableAlias}.${rootDataNodeRelationSql.unquotedJoinTableFieldRef2ColumnName}"`
    }
    else {
      // E.g. "u2ug".user_id "u2ug.user_id"
      fieldRef1ColumnSegment = `"${rootDataNode.fieldsInfo.joinTableAlias}".${rootDataNodeRelationSql.unquotedJoinTableFieldRef1ColumnName} "${rootDataNode.fieldsInfo.joinTableAlias}.${rootDataNodeRelationSql.unquotedJoinTableFieldRef1ColumnName}"`
      // E.g. "u2ug".user_group_id "u2ug.user_group_id"
      fieldRef2ColumnSegment = `"${rootDataNode.fieldsInfo.joinTableAlias}".${rootDataNodeRelationSql.unquotedJoinTableFieldRef2ColumnName} "${rootDataNode.fieldsInfo.joinTableAlias}.${rootDataNodeRelationSql.unquotedJoinTableFieldRef2ColumnName}"`
    }

    const rootDataNodeJoinTableColumnsSql = [fieldRef1ColumnSegment, fieldRef2ColumnSegment].join(', ')
    columnSegmentsLines.push(rootDataNodeJoinTableColumnsSql)
  }

  // ----------------------------------------------------------------------------------
  // -- To-one related data columns sql
  // ----------------------------------------------------------------------------------
  Object.values(queryNode.nonRootDataNodes).forEach(dataNode => {
    columnSegmentsLines.push(dataNode.createColumnsSqlSegments().join(', '))
  })

  const columnSegmentsSql = columnSegmentsLines.join(',\n')

  sqlParts.push(columnSegmentsSql)

  // ----------------------------------------------------------------------------------
  // -- Root "from"
  // ----------------------------------------------------------------------------------
  let fromSql: string = null
  if (isRangeConstrained) {
    // E.g. from "user" "_0"
    fromSql = `from ${rootDataNode.parent.dataFormat.sql.tableName} "_${rootDataNode.parent.unquotedTableAlias}"`
  }
  else if (isManyToMany) {
    const joinTableName = (rootDataNode.relation as Relation<RelationType.MANY_TO_MANY>).sql.joinTableName
    // E.g. from "user_to_user_group" "u2ug"
    fromSql = `from ${joinTableName} "${rootDataNode.fieldsInfo.joinTableAlias}"`
    // E.g. join "user_group" "1" on "1".id = "u2ug".user_group_id
    fromSql += `\njoin ${rootDataNode.dataFormat.sql.tableName} ${rootDataNode.tableAlias} on ${rootDataNode.tableAlias}.${rootDataNode.fieldRef.field} = ${rootDataNode.fieldsInfo.joinTableFullyQualifiedColumnName}`
  }
  else {
    // E.g. from "user" "0"
    fromSql = `from ${rootDataNode.dataFormat.sql.tableName} ${rootDataNode.tableAlias}`
  }
  sqlParts.push(fromSql)

  // ----------------------------------------------------------------------------------
  // -- Range-constraint part of root "from"
  // ----------------------------------------------------------------------------------
  if (isRangeConstrained) {
    sqlParts.push('join lateral (')

    sqlParts.push('select')

    const linkedColumnName = rootDataNode.dataFormat.sql.cols[rootDataNode.fieldRef.field]
    const parentLinkedColumnName = rootDataNode.parent.dataFormat.sql.cols[rootDataNode.parentFieldRef.field]

    // -- Lateral join select
    if (isManyToMany) {
      const columnSegmentsLines2: string[] = []

      // E.g. "0"."id" "id", "0"."email" "email", "0"."date_created" "date_created"
      const columnsSql = rootDataNode.fieldsInfo.fieldsToSelectFor.map(fName => {
        const columnName = rootDataNode.dataFormat.sql.cols[fName]
        return `${rootDataNode.tableAlias}.${columnName} ${columnName}`
      }).join(', ')
      columnSegmentsLines2.push(columnsSql)

      const joinTableAlias = rootDataNode.fieldsInfo.joinTableAlias
      const rootDataNodeRelationSql = (rootDataNode.relation as Relation<RelationType.MANY_TO_MANY>).sql
      // E.g. "u2ug"."user_id" "u2ug.user_id"
      const fieldRef1ColumnSegment = `"${joinTableAlias}".${rootDataNodeRelationSql.joinTableFieldRef1ColumnName} "${joinTableAlias}.${rootDataNodeRelationSql.unquotedJoinTableFieldRef1ColumnName}"`
      // E.g. "u2ug"."user_group_id" "u2ug.user_group_id"
      const fieldRef2ColumnSegment = `"${joinTableAlias}".${rootDataNodeRelationSql.joinTableFieldRef2ColumnName} "${joinTableAlias}.${rootDataNodeRelationSql.unquotedJoinTableFieldRef2ColumnName}"`

      const joinTableColumnsSql = [fieldRef1ColumnSegment, fieldRef2ColumnSegment].join(', ')
      columnSegmentsLines2.push(joinTableColumnsSql)

      const columnSegmentsSql2 = columnSegmentsLines2.join(',\n')

      sqlParts.push(columnSegmentsSql2)

      const joinTableName = (rootDataNode.relation as Relation<RelationType.MANY_TO_MANY>).sql.joinTableName

      // E.g. from "user_to_user_group" "u2ug"
      sqlParts.push(`from ${joinTableName} "${joinTableAlias}"`)

      // E.g. join "user_group" "1" on "1".id = "u2ug".user_group_id
      sqlParts.push(`join ${rootDataNode.dataFormat.sql.tableName} ${rootDataNode.tableAlias} on ${rootDataNode.tableAlias}.${rootDataNode.fieldRef.field} = ${rootDataNode.fieldsInfo.joinTableFullyQualifiedColumnName}`)

      // E.g. where "u2ug"."user_id" = "_0"."id"
      sqlParts.push(`where ${rootDataNode.fieldsInfo.joinTableParentFullyQualifiedColumnName} = "_${rootDataNode.parent.unquotedTableAlias}".${parentLinkedColumnName}`)
    }
    else {
      // E.g. "id", "email", "date_created"
      const columnsSql = rootDataNode.fieldsInfo.fieldsToSelectFor
        .map(fName => rootDataNode.dataFormat.sql.cols[fName])
        .join(', ')
      sqlParts.push(columnsSql)

      // E.g. from "image" "1"
      sqlParts.push(`from  ${rootDataNode.dataFormat.sql.tableName} ${rootDataNode.tableAlias}`)

      // E.g. where "1"."creator_user_id" = "_0"."id"
      sqlParts.push(`where ${rootDataNode.tableAlias}.${linkedColumnName} = "_${rootDataNode.parent.unquotedTableAlias}".${parentLinkedColumnName}`)
    }

    // -- Root data node query SQL
    const rootDataNodeQueryInfo = createDataNodeQueryInfo(rootDataNode, parameterStartIndex)
    if (rootDataNodeQueryInfo?.whereClause != null)
      sqlParts.push(`and ${rootDataNodeQueryInfo.whereClause}`)
    if (rootDataNodeQueryInfo?.orderByLimitOffset != null)
      sqlParts.push(rootDataNodeQueryInfo.orderByLimitOffset)

    if (rootDataNodeQueryInfo != null) {
      parameterStartIndex += rootDataNodeQueryInfo.values.length
      values.push(...rootDataNodeQueryInfo.values)
    }

    // -- As ... sql
    let asSql: string
    if (isManyToMany)
      asSql = `as ${rootDataNode.tableAlias} on ${rootDataNode.tableAlias}."${rootDataNode.fieldsInfo.joinTableParentColumnNameAlias}" = "_${rootDataNode.parent.unquotedTableAlias}".${parentLinkedColumnName}`
    else
      asSql = `as ${rootDataNode.tableAlias} on ${rootDataNode.tableAlias}.${linkedColumnName} = "_${rootDataNode.parent.unquotedTableAlias}".${parentLinkedColumnName}`

    sqlParts.push(`) ${asSql}`)
  }

  // ----------------------------------------------------------------------------------
  // -- To-one related data left joins
  // ----------------------------------------------------------------------------------
  const leftJoinsSql = createLeftJoinsSql(queryNode, parameterStartIndex)
  if (leftJoinsSql != null && leftJoinsSql.sql.length > 0)
    sqlParts.push(leftJoinsSql.sql)

  parameterStartIndex += leftJoinsSql.values.length
  values.push(...leftJoinsSql.values)

  // ----------------------------------------------------------------------------------
  // -- Linked field values where clause and (possibly) root data node query
  // ----------------------------------------------------------------------------------
  const linkedFieldValuesWhereClause = createLinkedFieldWhereClause(queryNode, linkedFieldValues)
  if (isRangeConstrained) {
    if (linkedFieldValuesWhereClause != null)
      sqlParts.push(`where ${linkedFieldValuesWhereClause}`)
  }
  else {
    const rootDataNodeQueryInfo = createDataNodeQueryInfo(rootDataNode, parameterStartIndex)
    const rootDataNodeTotalWhereClauseSegments = [linkedFieldValuesWhereClause, rootDataNodeQueryInfo?.whereClause].filter(s => s != null)
    if (rootDataNodeTotalWhereClauseSegments.length > 0) {
      const rootDataNodeTotalWhereClause = rootDataNodeTotalWhereClauseSegments.join(' and ')
      sqlParts.push(`where ${rootDataNodeTotalWhereClause}`)
    }

    if (rootDataNodeQueryInfo?.orderByLimitOffset != null)
      sqlParts.push(rootDataNodeQueryInfo.orderByLimitOffset)

    if (rootDataNodeQueryInfo != null) {
      parameterStartIndex += rootDataNodeQueryInfo.values.length
      values.push(...rootDataNodeQueryInfo.values)
    }
  }

  return { sql: sqlParts.join('\n'), values }
}

export const queryNodeToSql = <TIsPlural extends boolean = boolean>(
  queryNode: QueryNode<TIsPlural>,
  linkedFieldValues: any[] | null,
): QueryNodeSql<TIsPlural> => {
  let queryNodeSql: QueryNodeSql
  let currentLinkedFieldValues = linkedFieldValues

  const initialSql = toSql(queryNode, currentLinkedFieldValues)

  const updateSql = () => {
    const newSql = toSql(queryNode, currentLinkedFieldValues)
    queryNodeSql.sql = newSql.sql
    queryNodeSql.values = newSql.values
  }

  return queryNodeSql = {
    sql: initialSql.sql,
    values: initialSql.values,
    updateLinkedFieldValues: (newLinkedFieldValues: any[] | null) => {
      currentLinkedFieldValues = newLinkedFieldValues

      updateSql()
    },
    modifyRootDataNodeDataFilter: newDataFilter => {
      if (queryNode.rootDataNode.isPlural)
        throw new Error('Cannot update root data node data filter, it is plural. Try calling modifyRootDataNodeDataQuery().')

      const _nonPluralRootDataNode = queryNode.rootDataNode as DataNode<false>
      _nonPluralRootDataNode.options.filter = newDataFilter

      updateSql()
    },
    modifyRootDataNodeDataQuery: newDataQuery => {
      if (!queryNode.rootDataNode.isPlural)
        throw new Error('Cannot update root data node data query, it is non-plural. Try calling modifyRootDataNodeDataFilter().')

      const _pluralRootDataNode = queryNode.rootDataNode as DataNode<true>
      _pluralRootDataNode.options.query = newDataQuery

      updateSql()
    },
  }
}
