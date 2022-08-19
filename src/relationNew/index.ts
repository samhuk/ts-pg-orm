import {
  createManyToManyJoinTableFieldRefColumnName,
  createManyToManyJoinTableName,
  createManyToManyJoinTableSql,
  createOneToManyForeignKeySql,
  createOneToOneForeignKeySql,
} from './sql'
import { Relation, RelationOptions, RelationType } from './types'

const relationTypeToArrowText = {
  [RelationType.MANY_TO_MANY]: '<<-->>',
  [RelationType.ONE_TO_MANY]: '<-->>',
  [RelationType.ONE_TO_ONE]: '<-->',
}

const createRelationName = (options: RelationOptions): string => {
  switch (options.type) {
    case RelationType.MANY_TO_MANY:
      return `${options.fieldRef1.formatName}.${options.fieldRef1.fieldName} ${relationTypeToArrowText[RelationType.MANY_TO_MANY]} ${options.fieldRef2.formatName}.${options.fieldRef2.fieldName}`
    case RelationType.ONE_TO_MANY:
      return `${options.fromOneField.formatName}.${options.fromOneField.fieldName} ${relationTypeToArrowText[RelationType.ONE_TO_MANY]} ${options.toManyField.formatName}.${options.toManyField.fieldName}`
    case RelationType.ONE_TO_ONE:
      return `${options.fromOneField.formatName}.${options.fromOneField.fieldName} ${relationTypeToArrowText[RelationType.ONE_TO_ONE]} ${options.toOneField.formatName}.${options.toOneField.fieldName}`
    default:
      return null
  }
}

export const createRelation = <
  TOptions extends RelationOptions = RelationOptions
>(
    options: TOptions,
  // @ts-ignore
  ): Relation<TOptions['type'], TDataFormatsFromOptions, TOptions> => {
  const name = options.name ?? createRelationName(options)
  switch (options.type) {
    case RelationType.ONE_TO_ONE: {
      const relation: Relation<RelationType.ONE_TO_ONE> = {
        ...options,
        foreignKeySql: createOneToOneForeignKeySql(options),
        name: name as any,
      }
      return relation as any
    }
    case RelationType.ONE_TO_MANY: {
      const relation: Relation<RelationType.ONE_TO_MANY> = {
        ...options,
        foreignKeySql: createOneToManyForeignKeySql(options),
        name: name as any,
      }
      // @ts-ignore
      return relation
    }
    case RelationType.MANY_TO_MANY: {
      const joinTableName = createManyToManyJoinTableName(options)
      const relation: Relation<RelationType.MANY_TO_MANY> = {
        ...options,
        createJoinTableSql: createManyToManyJoinTableSql(options),
        joinTableName,
        joinTableFieldRef1ColumnName: createManyToManyJoinTableFieldRefColumnName(options.fieldRef1),
        joinTableFieldRef2ColumnName: createManyToManyJoinTableFieldRefColumnName(options.fieldRef2),
        dropJoinTableSql: `drop table if exists ${joinTableName}`,
        name: name as any,
      }
      return relation as any
    }
    default:
      return null
  }
}
