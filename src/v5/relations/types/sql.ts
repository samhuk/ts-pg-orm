import { RelationType } from '.'
import { TypeDependantBaseIntersection } from '../../../helpers/types'

export type RelationSql<
  TRelationType extends RelationType = RelationType,
> = TypeDependantBaseIntersection<RelationType, {
[RelationType.ONE_TO_ONE]: {
  sql: {
    foreignKeySql: string
  }
},
[RelationType.ONE_TO_MANY]: {
  sql: {
    foreignKeySql: string
  }
},
[RelationType.MANY_TO_MANY]: {
  sql: {
    createJoinTableSql: string
    joinTableName: string
    unquotedJoinTableName: string
    joinTableFieldRef1ColumnName: string
    unquotedJoinTableFieldRef1ColumnName: string
    joinTableFieldRef2ColumnName: string
    unquotedJoinTableFieldRef2ColumnName: string
    dropJoinTableSql: string
  }
},
}, TRelationType>
