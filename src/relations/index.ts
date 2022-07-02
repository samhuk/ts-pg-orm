import { DataFormatDeclarations } from '../dataFormat/types'
import { createManyToManyJoinTableName, createManyToManyJoinTableSql, createOneToManyForeignKeySql, createOneToOneForeignKeySql } from './sql'
import { RelationType, RelationDeclaration, Relation, ExtractRelationNameFromRelationDeclaration } from './types'

const relationTypeToArrowText = {
  [RelationType.MANY_TO_MANY]: '<<-->>',
  [RelationType.ONE_TO_MANY]: '<-->>',
  [RelationType.ONE_TO_ONE]: '<-->',
}

export const createRelationName = <
  T extends DataFormatDeclarations,
  K extends RelationDeclaration<T>
>(d: K): ExtractRelationNameFromRelationDeclaration<K> => {
  switch (d.type) {
    case RelationType.MANY_TO_MANY:
      return `${d.fieldRef1.formatName}.${d.fieldRef1.fieldName} ${relationTypeToArrowText[RelationType.MANY_TO_MANY]} ${d.fieldRef2.formatName}.${d.fieldRef2.fieldName}` as ExtractRelationNameFromRelationDeclaration<K>
    case RelationType.ONE_TO_MANY:
      return `${d.fromOneField.formatName}.${d.fromOneField.fieldName} ${relationTypeToArrowText[RelationType.ONE_TO_MANY]} ${d.toManyField.formatName}.${d.toManyField.fieldName}` as ExtractRelationNameFromRelationDeclaration<K>
    case RelationType.ONE_TO_ONE:
      return `${d.fromOneField.formatName}.${d.fromOneField.fieldName} ${relationTypeToArrowText[RelationType.ONE_TO_ONE]} ${d.toOneField.formatName}.${d.toOneField.fieldName}` as ExtractRelationNameFromRelationDeclaration<K>
    default:
      return null
  }
}

export const createRelation = <
  T extends DataFormatDeclarations,
  K extends RelationType,
  L extends RelationDeclaration<T, K>,
>(d: L, options?: { enablePostgreSql?: boolean }): Relation<T, K, L> => {
  const enableSql = (options?.enablePostgreSql ?? true)

  if (d.type === RelationType.MANY_TO_MANY) {
    const _d = d as RelationDeclaration<T, RelationType.MANY_TO_MANY>
    const joinTableName = createManyToManyJoinTableName(_d)
    const relation: Relation<T, RelationType.MANY_TO_MANY, RelationDeclaration<T, RelationType.MANY_TO_MANY>> = {
      type: _d.type,
      fieldRef1: _d.fieldRef1,
      fieldRef2: _d.fieldRef2,
      includeDateCreated: _d.includeDateCreated,
      getRelatedFieldRef1RecordsName: _d.getRelatedFieldRef1RecordsName,
      getRelatedFieldRef2RecordsName: _d.getRelatedFieldRef2RecordsName,
      relatedFieldRef1RecordsName: _d.relatedFieldRef1RecordsName,
      relatedFieldRef2RecordsName: _d.relatedFieldRef2RecordsName,
      sql: enableSql ? {
        type: _d.type,
        createJoinTableSql: createManyToManyJoinTableSql(_d),
        joinTableName,
        dropJoinTableSql: `drop table if exists ${joinTableName};`,
      } : null,
    }
    // @ts-ignore
    return relation
  }

  if (d.type === RelationType.ONE_TO_MANY) {
    const _d = d as RelationDeclaration<T, RelationType.ONE_TO_MANY>
    const relation: Relation<T, RelationType.ONE_TO_MANY, RelationDeclaration<T, RelationType.ONE_TO_MANY>> = {
      type: _d.type,
      fromOneField: _d.fromOneField,
      toManyField: _d.toManyField,
      getRelatedFromOneRecordsName: _d.getRelatedFromOneRecordsName,
      getRelatedToManyRecordsName: _d.getRelatedToManyRecordsName,
      relatedFromOneRecordsName: _d.relatedFromOneRecordsName,
      relatedToManyRecordsName: _d.relatedToManyRecordsName,
      sql: enableSql ? {
        type: _d.type,
        foreignKeySql: createOneToManyForeignKeySql(_d),
      } : null,
    }
    // @ts-ignore
    return relation
  }

  if (d.type === RelationType.ONE_TO_ONE) {
    const _d = d as RelationDeclaration<T, RelationType.ONE_TO_ONE>
    const relation: Relation<T, RelationType.ONE_TO_ONE, RelationDeclaration<T, RelationType.ONE_TO_ONE>> = {
      type: _d.type,
      fromOneField: _d.fromOneField,
      toOneField: _d.toOneField,
      getRelatedFromOneRecordsName: _d.getRelatedFromOneRecordsName,
      getRelatedToOneRecordsName: _d.getRelatedToOneRecordsName,
      relatedFromOneRecordsName: _d.relatedFromOneRecordsName,
      relatedToOneRecordsName: _d.relatedToOneRecordsName,
      sql: enableSql ? {
        type: _d.type,
        foreignKeySql: createOneToOneForeignKeySql(_d),
      } : null,
    }
    // @ts-ignore
    return relation
  }

  return null
}
