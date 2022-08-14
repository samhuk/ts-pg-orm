import { DataFormatDeclarations } from '../dataFormat/types'
import {
  createManyToManyJoinTableFieldRefColumnName,
  createManyToManyJoinTableName,
  createManyToManyJoinTableSql,
  createOneToManyForeignKeySql,
  createOneToOneForeignKeySql,
} from './sql'
import { RelationType, RelationDeclaration, Relation, ToRelationName } from './types'

const relationTypeToArrowText = {
  [RelationType.MANY_TO_MANY]: '<<-->>',
  [RelationType.ONE_TO_MANY]: '<-->>',
  [RelationType.ONE_TO_ONE]: '<-->',
}

/**
 * Creates the unique name for a relation.
 */
export const createRelationName = <
  T extends DataFormatDeclarations,
  K extends RelationDeclaration<T>
>(d: K): ToRelationName<K> => {
  switch (d.type) {
    case RelationType.MANY_TO_MANY:
      return `${d.fieldRef1.formatName}.${d.fieldRef1.fieldName} ${relationTypeToArrowText[RelationType.MANY_TO_MANY]} ${d.fieldRef2.formatName}.${d.fieldRef2.fieldName}` as ToRelationName<K>
    case RelationType.ONE_TO_MANY:
      return `${d.fromOneField.formatName}.${d.fromOneField.fieldName} ${relationTypeToArrowText[RelationType.ONE_TO_MANY]} ${d.toManyField.formatName}.${d.toManyField.fieldName}` as ToRelationName<K>
    case RelationType.ONE_TO_ONE:
      return `${d.fromOneField.formatName}.${d.fromOneField.fieldName} ${relationTypeToArrowText[RelationType.ONE_TO_ONE]} ${d.toOneField.formatName}.${d.toOneField.fieldName}` as ToRelationName<K>
    default:
      return null
  }
}

export const createRelation = <
  T extends DataFormatDeclarations,
  K extends RelationType,
  L extends RelationDeclaration<T, K>,
>(d: L, relationName: ToRelationName<L>): Relation<T, K, L> => {
  if (d.type === RelationType.MANY_TO_MANY) {
    const _d = d as RelationDeclaration<T, RelationType.MANY_TO_MANY>
    const joinTableName = createManyToManyJoinTableName(_d)
    const relation: Relation<T, RelationType.MANY_TO_MANY, RelationDeclaration<T, RelationType.MANY_TO_MANY>> = {
      ..._d,
      sql: {
        createJoinTableSql: createManyToManyJoinTableSql(_d),
        joinTableName,
        joinTableFieldRef1ColumnName: createManyToManyJoinTableFieldRefColumnName(_d.fieldRef1),
        joinTableFieldRef2ColumnName: createManyToManyJoinTableFieldRefColumnName(_d.fieldRef2),
        dropJoinTableSql: `drop table if exists ${joinTableName};`,
      },
      relationName: relationName as any,
    }
    // @ts-ignore
    return relation
  }

  if (d.type === RelationType.ONE_TO_MANY) {
    const _d = d as RelationDeclaration<T, RelationType.ONE_TO_MANY>
    const relation: Relation<T, RelationType.ONE_TO_MANY, RelationDeclaration<T, RelationType.ONE_TO_MANY>> = {
      ..._d,
      sql: {
        foreignKeySql: createOneToManyForeignKeySql(_d),
      },
      relationName: relationName as any,
    }
    // @ts-ignore
    return relation
  }

  if (d.type === RelationType.ONE_TO_ONE) {
    const _d = d as RelationDeclaration<T, RelationType.ONE_TO_ONE>
    const relation: Relation<T, RelationType.ONE_TO_ONE, RelationDeclaration<T, RelationType.ONE_TO_ONE>> = {
      ..._d,
      sql: {
        foreignKeySql: createOneToOneForeignKeySql(_d),
      },
      relationName: relationName as any,
    }
    // @ts-ignore
    return relation
  }

  return null
}
