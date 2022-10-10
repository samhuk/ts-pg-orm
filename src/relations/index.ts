import { DataFormats } from '../dataFormat/types'
import {
  createManyToManyRelationSql,
  createOneToManyRelationSql,
  createOneToOneRelationSql,
} from './sql'
import { Relation, RelationOptions, RelationType, ResovledRelationInfo } from './types'
import { createRelationName } from './name'

const resolveRelationDataFormatsAndFields = (
  options: RelationOptions,
  dataFormats: DataFormats,
): ResovledRelationInfo => {
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
  relationOptions: RelationOptions,
  dataFormats: DataFormats,
): Relation => {
  const resolvedInfo = resolveRelationDataFormatsAndFields(relationOptions, dataFormats)
  const name = createRelationName(resolvedInfo)

  switch (relationOptions.type) {
    case RelationType.ONE_TO_ONE: {
      const relation: Relation<RelationType.ONE_TO_ONE> = {
        ...relationOptions,
        name,
        sql: createOneToOneRelationSql(dataFormats, relationOptions),
      }
      return relation
    }
    case RelationType.ONE_TO_MANY: {
      const relation: Relation<RelationType.ONE_TO_MANY> = {
        ...relationOptions,
        name,
        sql: createOneToManyRelationSql(dataFormats, relationOptions),
      }
      return relation
    }
    case RelationType.MANY_TO_MANY: {
      const relation: Relation<RelationType.MANY_TO_MANY> = {
        ...relationOptions,
        name,
        sql: createManyToManyRelationSql(relationOptions, resolvedInfo),
      }
      return relation
    }
    default:
      return null
  }
}
