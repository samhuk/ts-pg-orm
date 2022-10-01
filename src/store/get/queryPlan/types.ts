import { DataFilterNodeOrGroup } from '@samhuk/data-filter/dist/types'
import { DataQueryRecord } from '@samhuk/data-query/dist/types'
import { SimplePgClient } from 'simple-pg-client/dist/types'
import { ValuesUnionFromDict } from '../../../helpers/types'
import { DataFormat, DataFormats } from '../../../dataFormat/types'
import { FieldRef } from '../../../dataFormat/types/fieldRef'
import { Relation, Relations } from '../../../relations/types'
import { AnyGetFunctionOptions, GetFunctionOptions, GetFunctionResult } from '../types'

export type RelatedDataInfo<
  TIsPlural extends boolean = boolean,
> = {
  /**
   * The name of the property name within the original get function options that
   * birthed this Data Node.
   */
  relatedDataPropName: string
  /**
   * The field ref of the parent Data Node's side of the relation.
   */
  parentFieldRef: FieldRef
  /**
   * The field ref of this Data Node's side of the relation.
   */
  fieldRef: FieldRef
  /**
   * Denotes the Data Node as either singular or plural. This essentially represents if
   * this Data Node is the "to-many" side of `relation`.
   */
  isPlural: TIsPlural
  /**
   * The relation between this Data Node and it's parent Data Node.
   */
  relation: Relation
}

export type RelatedDataInfoDict = { [relatedDataPropName: string]: RelatedDataInfo }

export type UnresolvedDataNode = RelatedDataInfo & {
  /**
   * Unique identifier of the Data Node.
   */
  id: number
  /**
   * The Data Format of the Data Node. This is driven by what the parent Data Node
   * is, and what related data property name links them.
   */
  dataFormat: DataFormat
  /**
   * Identifier of the parent Data Node.
   */
  parentId: number
  /**
   * List of identifiers of the child Data Nodes.
   */
  childIds: number[]
  /**
   * The original get function options for this Data Node.
   */
  options: AnyGetFunctionOptions
}

export type UnresolvedDataNodes = { [dataNodeId: number]: UnresolvedDataNode }

export type FieldsInfo = {
  /**
   * List of field names that must be included in the select query of the Query Node
   * of the Data Node.
   */
  fieldsToSelectFor: string[]
  /**
   * List of field names that have been included in `fieldsToSelectFor` only because they
   * are required by relations.
   */
  fieldsOnlyUsedForRelations: string[]
  /**
   * List of field names within `fieldsToSelectFor` that must be kept in the final record(s)
   * of this Data Node.
   */
  fieldsToKeepInRecord: string[]
  /**
   * E.g. `user_id` => `0.userId`
   */
  fieldToColumnNameAlias: { [fieldName: string]: string }
  /**
   * E.g. `"0.userId"` => `user_id`
   */
  columnNameAliasToField: { [columnNameAlias: string]: string }
  /**
   * E.g. `user_id` => `"0".user_id`
   */
  fieldToFullyQualifiedColumnName: { [fieldName: string]: string }
  /**
   * Unquoted join table name
   */
  joinTableAlias?: string
  joinTableParentColumnNameAlias?: string
  joinTableParentFullyQualifiedColumnName?: string
  joinTableFullyQualifiedColumnName?: string
}

/**
 * A Data Node represents a single table as part of a Query Node's SQL.
 */
export type DataNode<
  TIsPlural extends boolean = boolean
> = RelatedDataInfo<TIsPlural> & {
  /**
   * Unique identifier of the Data Node.
   */
  id: number
  /**
   * The Data Format of the Data Node. This is driven by what the parent Data Node
   * is, and what related data property name links them.
   */
  dataFormat: DataFormat
  /**
   * Reference to the parent Data Node.
   */
  parent: DataNode
  /**
   * References to the child Data Nodes.
   */
  children: DataNodes
  /**
   * The original get function options for this Data Node.
   */
  options: AnyGetFunctionOptions<TIsPlural>
  /**
   * A collection of useful information about the fields, i.e. fields to include in
   * the select query for this Data Node, column name aliases, etc.
   */
  fieldsInfo: FieldsInfo
  /**
   * Quoted alias for the table of this data node, i.e. `"0"`.
   */
  tableAlias: string
  /**
   * Unquoted alias for the table of this data node, i.e. `0`.
   */
  unquotedTableAlias: string
  /**
   * Creates a list of the column sql segments, e.g. `"0".id "0.id"`, `"0".name "0.name"`, ` "0".email "0.email"`
   */
  createColumnsSqlSegments: () => string[]
}

export type PluralDataNode = DataNode<true>

export type NonPluralDataNode = DataNode<false>

export type DataNodes = { [dataNodeId: number]: DataNode }

export type NonRootDataNode = DataNode<false>

export type NonRootDataNodes = { [dataNodeId: number]: NonRootDataNode }

export type ParentQueryNodeLink<
  TIsPlural extends boolean = boolean
> = {
  parentQueryNode: QueryNode<TIsPlural>
  parentDataNode: DataNode
}

export type ChildQueryNodeLink = {
  childQueryNode: QueryNode
  sourceDataNode: DataNode
}

/**
 * SQL representation of a Query Node.
 */
export type QueryNodeSql<
  TIsPlural extends boolean = boolean
> = {
  /**
   * SQL query text
   */
  sql: string
  /**
   * Updates the linked field values-dependant part of the SQL query text.
   */
  updateLinkedFieldValues: (values: any[]) => void
} & (TIsPlural extends true ? {
  /**
   * Modifies the part of the SQL query text that is dependant on the root Data Node data query.
   */
  modifyRootDataNodeDataQuery: (newDataQuery: DataQueryRecord) => void
} : {
  /**
   * Modifies the part of the SQL query text that is dependant on the root Data Node data filter.
   */
  modifyRootDataNodeDataFilter: (newDataFilter: DataFilterNodeOrGroup) => void
})

/**
 * A Query Node represents a single SQL query that is ran. Query nodes are composed of
 * a directed acyclical graph of Data Nodes, with one of them as a root Data Node and
 * all others non-root.
 *
 * The root Data Node is either singular or plural, but all other Data Nodes (non-root)
 * are always singular.
 *
 * The root Data Node represents the "root SQL query", i.e. `SELECT ... FROM {root data node table}`.
 * Non-root data nodes, being singular, are LEFT JOIN-ed onto the root SQL query.
 */
export type QueryNode<
  TIsPlural extends boolean = boolean
> = {
  /**
   * Unique identifier of the Query Node.
   */
  id: number
  /**
   * Display name of the Query Node. This has no effect on the actual execution of the Query Node.
   */
  name: string
  /**
   * The root Data Node.
   */
  rootDataNode: DataNode<TIsPlural>
  /**
   * Non-root Data Nodes.
   */
  nonRootDataNodes: NonRootDataNodes
  /**
   * All Data Nodes, root and non-root.
   */
  dataNodes: DataNodes
  /**
   * A reference to the parent Query Node of this Query Node.
   */
  parentQueryNodeLink: ParentQueryNodeLink
  /**
   * A list of references to the child Query Nodes of this Query Node.
   */
  childQueryNodeLinks: ChildQueryNodeLink[]
  /**
   * Cnnverts this Query Node to QueryNodeSql.
   */
  toSql: (linkedFieldValues?: any[]) => QueryNodeSql
}

export type QueryNodes = { [queryNodeId: number]: QueryNode }

/**
 * A Query Plan represents a directed acyclical graph of Query Nodes, with one root Query Node
 * and all others non-root Query Nodes.
 *
 * Query Plans are created from get function options, and can be re-executed with different root
 * Data Node data queries/filters for more efficient performance.
 */
export type QueryPlan<
  TDataFormats extends DataFormats = DataFormats,
  TRelations extends Relations = Relations,
  TLocalDataFormat extends DataFormat = DataFormat,
  TIsPlural extends boolean = boolean,
  TOptions extends GetFunctionOptions<TDataFormats, TRelations, TLocalDataFormat, TIsPlural> =
    GetFunctionOptions<TDataFormats, TRelations, TLocalDataFormat, TIsPlural>,
> = {
  dataNodes: DataNodes
  queryNodes: QueryNodes
  rootQueryNode: QueryNode
  /**
   * Executes the query plan, using the given database service `db`, returning the results.
   *
   * This will recursively work through the Query Node graph, starting at the root Query Node.
   */
  execute: (db: SimplePgClient) => Promise<GetFunctionResult<TDataFormats, TRelations, TLocalDataFormat, TIsPlural, TOptions>>
} & (TIsPlural extends true ? {
  /**
   * Modifies the data query of the root node of the query plan. This is more efficient than
   * creating a whole new query plan.
   */
  modifyRootDataQuery: (newDataQuery: DataQueryRecord<ValuesUnionFromDict<TLocalDataFormat['fields']>['name']>) => void
} : {
  /**
   * Modifies the data filter of the root node of the query plan. This is more efficient than
   * creating a whole new query plan.
   */
  modifyRootDataFilter: (newDataFilter: DataFilterNodeOrGroup<ValuesUnionFromDict<TLocalDataFormat['fields']>['name']>) => void
})
