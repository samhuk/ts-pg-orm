import { DataFormatsDict, DataFormat, FieldRef, DataFormatDeclarations } from '../../dataFormat/types'
import { removeDuplicates } from '../../helpers/array'
import { toDict } from '../../helpers/dict'
import { RelationsDict, RelationType, Relation, RelationDeclarations } from '../../relations/types'
import { AnyGetFunctionOptions, GetFunctionOptions } from '../types/get'
import { RelatedDataInfoDict, DataNodes, UnresolvedDataNodes, FieldsInfo, DataNode, PluralDataNode, NonPluralDataNode } from './types'

/**
 * Determines all of the related data properties of the given `dataFormat`
 * and determines various useful properties of each related data property,
 * such as the local and foreign (or "this" and "parent") field refs, and
 * whether the "this" field ref is plural or not, which will be very instrumental
 * later in the query plan framework.
 */
const createRelatedDataInfoDict = (
  relations: RelationsDict,
  dataFormats: DataFormatsDict,
  dataFormat: DataFormat,
): RelatedDataInfoDict => {
  const relatedDataInfoDict: RelatedDataInfoDict = {}
  Object.values(relations).forEach(r => {
    let parentFieldRef: FieldRef
    let fieldRef: FieldRef
    let manuallyDefinedRelatedDataPropName: string
    let isPlural: boolean
    if (r.type === RelationType.ONE_TO_ONE) {
      if (r.fromOneField.formatName === dataFormat.name) {
        fieldRef = r.toOneField
        parentFieldRef = r.fromOneField
        manuallyDefinedRelatedDataPropName = r.relatedToOneRecordsName
        isPlural = false
      }
      if (r.toOneField.formatName === dataFormat.name) {
        fieldRef = r.fromOneField
        parentFieldRef = r.toOneField
        manuallyDefinedRelatedDataPropName = r.relatedFromOneRecordsName
        isPlural = false
      }
    }
    if (r.type === RelationType.ONE_TO_MANY) {
      if (r.fromOneField.formatName === dataFormat.name) {
        fieldRef = r.toManyField
        parentFieldRef = r.fromOneField
        manuallyDefinedRelatedDataPropName = r.relatedToManyRecordsName
        isPlural = true
      }
      if (r.toManyField.formatName === dataFormat.name) {
        fieldRef = r.fromOneField
        parentFieldRef = r.toManyField
        manuallyDefinedRelatedDataPropName = r.relatedFromOneRecordsName
        isPlural = false
      }
    }
    if (r.type === RelationType.MANY_TO_MANY) {
      if (r.fieldRef1.formatName === dataFormat.name) {
        fieldRef = r.fieldRef2
        parentFieldRef = r.fieldRef1
        manuallyDefinedRelatedDataPropName = r.relatedFieldRef2RecordsName
        isPlural = true
      }
      if (r.fieldRef2.formatName === dataFormat.name) {
        fieldRef = r.fieldRef1
        parentFieldRef = r.fieldRef2
        manuallyDefinedRelatedDataPropName = r.relatedFieldRef1RecordsName
        isPlural = true
      }
    }

    if (parentFieldRef != null) {
      const relatedDataPropName = manuallyDefinedRelatedDataPropName
      ?? (isPlural
        ? dataFormats[fieldRef.formatName].pluralizedName
        : dataFormats[fieldRef.formatName].name
      )
      relatedDataInfoDict[relatedDataPropName] = {
        relatedDataPropName,
        parentFieldRef,
        fieldRef,
        isPlural,
        relation: r,
      }
    }
  })
  return relatedDataInfoDict
}

const traverseOptionsToDataNodes = (
  relations: RelationsDict,
  dataFormats: DataFormatsDict,
  optionsNode: AnyGetFunctionOptions,
  dataFormat: DataFormat,
  isPlural: boolean,
  unresolvedDataNodes: UnresolvedDataNodes,
  state: { id: number },
  parentNodeId?: number,
  relatedDataPropName?: string,
  parentFieldRef?: FieldRef,
  fieldRef?: FieldRef,
  relation?: Relation,
): void => {
  const thisId = state.id
  const childIds: number[] = []

  if (optionsNode.relations != null && Object.keys(optionsNode.relations).length > 0) {
    const relatedDataInfoDict = createRelatedDataInfoDict(relations, dataFormats, dataFormat)
    Object.entries(optionsNode.relations).forEach(([_relatedDataPropName, _options]) => {
      state.id += 1
      childIds.push(state.id)
      const relatedDataInfo = relatedDataInfoDict[_relatedDataPropName]
      traverseOptionsToDataNodes(
        relations,
        dataFormats,
        _options,
        dataFormats[relatedDataInfo.fieldRef.formatName],
        relatedDataInfo.isPlural,
        unresolvedDataNodes,
        state,
        thisId,
        _relatedDataPropName,
        relatedDataInfo.parentFieldRef,
        relatedDataInfo.fieldRef,
        relatedDataInfo.relation,
      )
    })
  }

  unresolvedDataNodes[thisId] = {
    id: thisId,
    dataFormat,
    childIds,
    parentId: parentNodeId,
    options: optionsNode,
    fieldRef,
    parentFieldRef,
    relation,
    relatedDataPropName,
    isPlural,
  }
}

const createFieldsInfo = (dataNode: DataNode): FieldsInfo => {
  const fieldsToKeepInRecord = dataNode.options.fields ?? dataNode.dataFormat.fieldNameList
  const fieldsRequiredForRelations = Object.values(dataNode.children)
    .map(node => node.parentFieldRef.fieldName)
    // If this node has a many-to-many relation to it, then it doesn't need to include it's
    // field ref (it's side of the relation). Instead, the junction table's columns are used.
    .concat(dataNode.relation?.type === RelationType.MANY_TO_MANY || dataNode.fieldRef == null
      ? []
      : [dataNode.fieldRef.fieldName])
  const fieldsToSelectFor = dataNode.options.fields != null
    ? removeDuplicates(dataNode.options.fields.concat(fieldsRequiredForRelations))
    : dataNode.dataFormat.fieldNameList
  const fieldsOnlyUsedForRelations = dataNode.options.fields != null
    ? fieldsToSelectFor.filter(fName => fieldsToKeepInRecord.indexOf(fName) === -1)
    : []

  const columnNameAliasToField: { [s: string]: string } = {}
  const fieldToColumnNameAlias: { [s: string]: string } = {}
  const fieldToFullyQualifiedColumnName: { [s: string]: string } = {}

  dataNode.dataFormat.fieldNameList.forEach(fName => {
    const columnAlias = `${dataNode.id}.${fName}`
    columnNameAliasToField[columnAlias] = fName
    fieldToColumnNameAlias[fName] = columnAlias
    fieldToFullyQualifiedColumnName[fName] = `${dataNode.tableAlias}.${dataNode.dataFormat.sql.columnNames[fName]}`
  })

  let joinTableAlias: string
  let joinTableParentFullyQualifiedColumnName: string
  let joinTableParentColumnNameAlias: string
  let joinTableFullyQualifiedColumnName: string
  if (dataNode.relation?.type === RelationType.MANY_TO_MANY) {
    // TODO: Need a way to provide an alias for this
    joinTableAlias = `${dataNode.relation.sql.joinTableName}`
    const isFieldRefFieldRef1 = dataNode.relation.fieldRef1.formatName === dataNode.dataFormat.name
    const parentJoinTableColumnName = isFieldRefFieldRef1
      ? dataNode.relation.sql.joinTableFieldRef2ColumnName
      : dataNode.relation.sql.joinTableFieldRef1ColumnName
    joinTableParentFullyQualifiedColumnName = `"${joinTableAlias}"."${parentJoinTableColumnName}"`
    joinTableParentColumnNameAlias = `${joinTableAlias}.${parentJoinTableColumnName}`
    const joinTableColumnName = isFieldRefFieldRef1
      ? dataNode.relation.sql.joinTableFieldRef1ColumnName
      : dataNode.relation.sql.joinTableFieldRef2ColumnName
    joinTableFullyQualifiedColumnName = `"${joinTableAlias}"."${joinTableColumnName}"`
  }

  return {
    fieldsToSelectFor,
    fieldsToKeepInRecord,
    fieldsOnlyUsedForRelations,
    columnNameAliasToField,
    fieldToColumnNameAlias,
    fieldToFullyQualifiedColumnName,
    joinTableAlias,
    joinTableParentFullyQualifiedColumnName,
    joinTableParentColumnNameAlias,
    joinTableFullyQualifiedColumnName,
  }
}

const resolveDataNodes = (unresolvedDataNodes: UnresolvedDataNodes): DataNodes => {
  const dataNodes: DataNodes = {}
  Object.values(unresolvedDataNodes).forEach(node => {
    const dataNode: DataNode = {
      id: node.id,
      dataFormat: node.dataFormat,
      isPlural: node.isPlural,
      options: node.options,
      fieldRef: node.fieldRef,
      parentFieldRef: node.parentFieldRef,
      relatedDataPropName: node.relatedDataPropName,
      relation: node.relation,
      tableAlias: `"${node.id}"`,
      unquotedTableAlias: node.id.toString(),
      createColumnsSqlSegments: () => dataNode.fieldsInfo.fieldsToSelectFor.map(fName => (
        `${dataNode.fieldsInfo.fieldToFullyQualifiedColumnName[fName]} "${dataNode.fieldsInfo.fieldToColumnNameAlias[fName]}"`
      )),
      // These will be set later, once we have all of the data node references in the dataNodes dict
      children: {},
      parent: null,
      fieldsInfo: undefined,
    }
    dataNodes[node.id] = dataNode
  })

  // Retroactively set the children, parent, and fieldsInfo of each data node
  Object.values(dataNodes).forEach(dataNode => {
    dataNode.children = toDict(
      unresolvedDataNodes[dataNode.id].childIds,
      id => ({ key: id, value: dataNodes[id] }),
    )
    dataNode.parent = dataNodes[unresolvedDataNodes[dataNode.id].parentId]
    dataNode.fieldsInfo = createFieldsInfo(dataNode)
  })

  return dataNodes
}

export const toDataNodes = <
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number],
  TIsPlural extends boolean,
>(
    relations: RelationsDict<T, K>,
    dataFormats: DataFormatsDict<T>,
    dataFormat: DataFormat<L>,
    isPlural: TIsPlural,
    options: GetFunctionOptions<T, K, L, TIsPlural>,
  ): DataNodes => {
  const unresolvedDataNodes: UnresolvedDataNodes = { }
  /* Recursively traverse each node in the given `options`, adding unresolved data nodes
   * to the provided dict.
   */
  traverseOptionsToDataNodes(
    relations,
    dataFormats as any,
    options as any,
    dataFormat as any,
    isPlural,
    unresolvedDataNodes,
    { id: 0 },
  )
  /* Resolve each data node in the dict, which means, amongst some other changes,
   * converting all of the child and parent data node id links into references to other
   * data nodes. This will make things much easier later on in the query plan framework,
   * such as making it so that we don't have to carry around the whole data nodes dict
   * all the time (because each resovled data node will have direct references to
   * surrounding data nodes).
   */
  return resolveDataNodes(unresolvedDataNodes)
}

export const isDataNodePlural = (dataNode: PluralDataNode | NonPluralDataNode): dataNode is PluralDataNode => dataNode.isPlural
