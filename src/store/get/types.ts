import { DataFilterNodeOrGroup } from '@samhuk/data-filter/dist/types'
import { DataQueryRecord } from '@samhuk/data-query/dist/types'
import { SimplePgClient } from 'simple-pg-client/dist/types'
import { DataFormat, DataFormatDeclarations, FieldRef } from '../../dataFormat/types'
import { Relation, RelationDeclarations } from '../../relations/types'
import { AnyGetFunctionOptions, GetFunctionOptions, GetFunctionResult } from '../types/get'

export type RelatedDataInfo<
  TIsPlural extends boolean = boolean,
> = {
  relatedDataPropName: string
  parentFieldRef: FieldRef
  fieldRef: FieldRef
  isPlural: TIsPlural
  relation: Relation
}

export type RelatedDataInfoDict = { [relatedDataPropName: string]: RelatedDataInfo }

export type UnresolvedDataNode = RelatedDataInfo & {
  id: number
  dataFormat: DataFormat
  parentId: number
  childIds: number[]
  options: AnyGetFunctionOptions
}

export type UnresolvedDataNodes = { [dataNodeId: number]: UnresolvedDataNode }

export type FieldsInfo = {
  fieldsToSelectFor: string[]
  fieldsOnlyUsedForRelations: string[]
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
}

export type DataNode<
  TIsPlural extends boolean = boolean
> = RelatedDataInfo<TIsPlural> & {
  id: number
  dataFormat: DataFormat
  parent: DataNode
  children: DataNodes
  options: AnyGetFunctionOptions<TIsPlural>
  fieldsInfo: FieldsInfo
  /**
   * Quoted alias for the table of this data node, i.e. `"0"`.
   */
  tableAlias: string
  createColumnsSqlSegments: () => string[]
}

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

export type QueryNodeSql<
  TIsPlural extends boolean = boolean
> = {
  sql: string
  updateLinkedFieldValues: (values: any[]) => void
} & (TIsPlural extends true ? {
  modifyRootDataNodeDataQuery: (newDataQuery: DataQueryRecord) => void
} : {
  modifyRootDataNodeDataFilter: (newDataFilter: DataFilterNodeOrGroup) => void
})

export type QueryNode<
  TIsPlural extends boolean = boolean
> = {
  id: number
  name: string
  rootDataNode: DataNode<TIsPlural>
  nonRootDataNodes: NonRootDataNodes
  dataNodes: DataNodes
  parentQueryNodeLink: ParentQueryNodeLink
  childQueryNodeLinks: ChildQueryNodeLink[]
  toSql: (linkedFieldValues?: any[]) => QueryNodeSql
}

export type QueryNodes = { [queryNodeId: number]: QueryNode }

export type QueryPlan<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  K extends RelationDeclarations<T> = RelationDeclarations<T>,
  L extends T[number] = T[number],
  TIsPlural extends boolean = boolean,
  TOptions extends GetFunctionOptions<T, K, L, TIsPlural> = GetFunctionOptions<T, K, L, TIsPlural>,
> = {
  dataNodes: DataNodes
  queryNodes: QueryNodes
  rootQueryNode: QueryNode
  // compile: () => void
  execute: (db: SimplePgClient) => Promise<GetFunctionResult<T, K, L, TIsPlural, TOptions>>
} & (TIsPlural extends true ? {
  modifyRootDataQuery: (newDataQuery: DataQueryRecord<L['fields'][number]['name']>) => void
} : {
  modifyRootDataFilter: (newDataFilter: DataFilterNodeOrGroup<L['fields'][number]['name']>) => void
})
