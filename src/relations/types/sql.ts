import { RelationType } from '.'
import { TypeDependantBaseIntersection } from '../../helpers/types'

export type NonManyToManyRelationSql = {
  foreignKeyName: string
  foreignKeySql: string
}

export type ManyToManyRelationSql = {
  createJoinTableSql: string
  joinTableName: string
  unquotedJoinTableName: string
  joinTableFieldRef1ColumnName: string
  unquotedJoinTableFieldRef1ColumnName: string
  joinTableFieldRef2ColumnName: string
  unquotedJoinTableFieldRef2ColumnName: string
  dropJoinTableSql: string
}

export type RelationSql<
  TRelationType extends RelationType = RelationType,
> = TypeDependantBaseIntersection<RelationType, {
  [RelationType.ONE_TO_ONE]: { sql: NonManyToManyRelationSql }
  [RelationType.ONE_TO_MANY]: { sql: NonManyToManyRelationSql }
  [RelationType.MANY_TO_MANY]: { sql: ManyToManyRelationSql }
}, TRelationType>
