import { capitalize, quote } from '../../helpers/string'
import { DataFormat, DataFormats } from '../dataFormat/types'
import { Field } from '../dataFormat/types/field'
import {
  createManyToManyJoinTableFieldRefColumnName,
  createManyToManyJoinTableName,
  createManyToManyJoinTableSql,
  createOneToManyForeignKeySql,
  createOneToOneForeignKeySql,
} from './sql'
import { Relation, RelationOptions, RelationType } from './types'

type ResovledRelationInfo = {
  leftDataFormat: DataFormat
  rightDataFormat: DataFormat
  leftField: Field
  rightField: Field
}

const createRelationName = (resolvedInfo: ResovledRelationInfo) => (
  // E.g. "userIdToArticleCreatorUserId"
  `${resolvedInfo.leftDataFormat.name}${capitalize(resolvedInfo.leftField.name)}To$${capitalize(resolvedInfo.rightDataFormat.name)}${capitalize(resolvedInfo.rightField.name)}`
)

const resolveRelationDataFormatsAndFields = (
  options: RelationOptions,
  dataFormats: DataFormats,
) => {
  switch (options.type) {
    case RelationType.ONE_TO_ONE: {
      return {
        leftDataFormat: dataFormats[options.fromOneField.dataFormat],
        rightDataFormat: dataFormats[options.toOneField.dataFormat],
        leftField: dataFormats[options.fromOneField.dataFormat].fields[options.fromOneField.field],
        rightField: dataFormats[options.toOneField.dataFormat].fields[options.toOneField.field],
      }
    }
    case RelationType.ONE_TO_MANY: {
      return {
        leftDataFormat: dataFormats[options.fromOneField.dataFormat],
        rightDataFormat: dataFormats[options.toManyField.dataFormat],
        leftField: dataFormats[options.fromOneField.dataFormat].fields[options.fromOneField.field],
        rightField: dataFormats[options.toManyField.dataFormat].fields[options.toManyField.field],
      }
    }
    case RelationType.MANY_TO_MANY: {
      return {
        leftDataFormat: dataFormats[options.fieldRef1.dataFormat],
        rightDataFormat: dataFormats[options.fieldRef2.dataFormat],
        leftField: dataFormats[options.fieldRef1.dataFormat].fields[options.fieldRef1.field],
        rightField: dataFormats[options.fieldRef2.dataFormat].fields[options.fieldRef2.field],
      }
    }
    default:
      return null
  }
}

export const createRelation = (
  options: RelationOptions,
  dataFormats: DataFormats,
): Relation => {
  const resolvedInfo = resolveRelationDataFormatsAndFields(options, dataFormats)

  switch (options.type) {
    case RelationType.ONE_TO_ONE: {
      const relation: Relation<RelationType.ONE_TO_ONE> = {
        ...options,
        name: createRelationName(resolvedInfo),
        sql: { foreignKeySql: createOneToOneForeignKeySql(options) },
      }
      return relation
    }
    case RelationType.ONE_TO_MANY: {
      const relation: Relation<RelationType.ONE_TO_MANY> = {
        ...options,
        name: createRelationName(resolvedInfo),
        sql: { foreignKeySql: createOneToManyForeignKeySql(options) },
      }
      return relation
    }
    case RelationType.MANY_TO_MANY: {
      const unquotedJoinTableName = createManyToManyJoinTableName(options)
      const unquotedJoinTableFieldRef1ColumnName = createManyToManyJoinTableFieldRefColumnName(options.fieldRef1)
      const unquotedJoinTableFieldRef2ColumnName = createManyToManyJoinTableFieldRefColumnName(options.fieldRef2)

      const relation: Relation<RelationType.MANY_TO_MANY> = {
        ...options,
        name: createRelationName(resolvedInfo),
        sql: {
          createJoinTableSql: createManyToManyJoinTableSql(options),
          dropJoinTableSql: `drop table if exists "${unquotedJoinTableName}";`,
          unquotedJoinTableFieldRef1ColumnName,
          joinTableFieldRef1ColumnName: quote(unquotedJoinTableFieldRef1ColumnName),
          unquotedJoinTableFieldRef2ColumnName,
          joinTableFieldRef2ColumnName: quote(unquotedJoinTableFieldRef2ColumnName),
          unquotedJoinTableName,
          joinTableName: quote(unquotedJoinTableName),
        },
      }
      return relation
    }
    default:
      return null
  }
}
