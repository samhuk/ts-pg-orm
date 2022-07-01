import { DataFormat, DataFormatDeclarations, DataFormatsDict, FieldRef } from '../../dataFormat/types'
import { createManyToManyJoinTableFieldRef2ColumnName, createManyToManyJoinTableFieldRef1ColumnName } from '../../relations/sql'
import { Relation, RelationDeclaration, RelationType } from '../../relations/types'

const getSqlInformation = <
T extends DataFormatDeclarations,
>(
    dataFormats: DataFormatsDict<T>,
    localFieldRef: FieldRef,
    foreignFieldRef: FieldRef,
  ) => {
  // @ts-ignore
  const localDataFormat = dataFormats[localFieldRef.formatName] as DataFormat
  const localTableName = localDataFormat.sql.tableName
  const localColumnName = localDataFormat.sql.columnNames[localFieldRef.fieldName]

  // @ts-ignore
  const foreignDataFormat = dataFormats[foreignFieldRef.formatName] as DataFormat
  const foreignTableName = foreignDataFormat.sql.tableName
  const foreignColumnName = foreignDataFormat.sql.columnNames[foreignFieldRef.fieldName]
  const foreignColumnsSql = foreignDataFormat.sql.columnNameList
    .map(columnName => `${foreignTableName}.${columnName}`)
    .join(', ')

  return {
    localTableName,
    localColumnName,
    foreignTableName,
    foreignColumnName,
    foreignColumnsSql,
  }
}

export const createOneToOneFromOneRelationSelectSql = <
  T extends DataFormatDeclarations,
>(
    dataFormats: DataFormatsDict<T>,
    relation: Relation<T, RelationType.ONE_TO_ONE, RelationDeclaration<T, RelationType.ONE_TO_ONE>>,
  ) => {
  const sqlInfo = getSqlInformation(dataFormats, relation.fromOneField, relation.toOneField)

  return `select ${sqlInfo.foreignColumnsSql} from ${sqlInfo.localTableName}
join ${sqlInfo.foreignTableName} on ${sqlInfo.foreignTableName}.${sqlInfo.foreignColumnName} = ${sqlInfo.localTableName}.${sqlInfo.localColumnName}
where ${sqlInfo.localTableName}.id = $1 limit 1`
}

export const createOneToOneToOneRelationSelectSql = <
  T extends DataFormatDeclarations,
>(
    dataFormats: DataFormatsDict<T>,
    relation: Relation<T, RelationType.ONE_TO_ONE, RelationDeclaration<T, RelationType.ONE_TO_ONE>>,
  ) => {
  const sqlInfo = getSqlInformation(dataFormats, relation.toOneField, relation.fromOneField)

  return `select ${sqlInfo.foreignColumnsSql} from ${sqlInfo.localTableName}
join ${sqlInfo.foreignTableName} on ${sqlInfo.foreignTableName}.${sqlInfo.foreignColumnName} = ${sqlInfo.localTableName}.${sqlInfo.localColumnName}
where ${sqlInfo.localTableName}.id = $1 limit 1`
}

export const createOneToManyFromOneRelationSelectSql = <
  T extends DataFormatDeclarations,
>(
    dataFormats: DataFormatsDict<T>,
    relation: Relation<T, RelationType.ONE_TO_MANY, RelationDeclaration<T, RelationType.ONE_TO_MANY>>,
  ) => {
  const sqlInfo = getSqlInformation(dataFormats, relation.fromOneField, relation.toManyField)

  return `select ${sqlInfo.foreignColumnsSql} from ${sqlInfo.localTableName}
join ${sqlInfo.foreignTableName} on ${sqlInfo.foreignTableName}.${sqlInfo.foreignColumnName} = ${sqlInfo.localTableName}.${sqlInfo.localColumnName}
where ${sqlInfo.localTableName}.id = $1`
}

export const createOneToManyToManyRelationSelectSql = <
  T extends DataFormatDeclarations,
>(
    dataFormats: DataFormatsDict<T>,
    relation: Relation<T, RelationType.ONE_TO_MANY, RelationDeclaration<T, RelationType.ONE_TO_MANY>>,
  ) => {
  const sqlInfo = getSqlInformation(dataFormats, relation.toManyField, relation.fromOneField)

  return `select ${sqlInfo.foreignColumnsSql} from ${sqlInfo.localTableName}
join ${sqlInfo.foreignTableName} on ${sqlInfo.foreignTableName}.${sqlInfo.foreignColumnName} = ${sqlInfo.localTableName}.${sqlInfo.localColumnName}
where ${sqlInfo.localTableName}.id = $1 limit 1`
}

export const createManyToManyFieldRef1RelationSelectSql = <
  T extends DataFormatDeclarations,
>(
    dataFormats: DataFormatsDict<T>,
    relation: Relation<T, RelationType.MANY_TO_MANY, RelationDeclaration<T, RelationType.MANY_TO_MANY>>,
  ) => {
  const sqlInfo = getSqlInformation(dataFormats, relation.fieldRef1, relation.fieldRef2)
  const joinTableTableName = relation.sql.joinTableName

  return (
    `select ${sqlInfo.foreignColumnsSql} from ${sqlInfo.localTableName}
join ${joinTableTableName} on ${joinTableTableName}.${createManyToManyJoinTableFieldRef1ColumnName(relation)} = ${sqlInfo.localTableName}.${sqlInfo.localColumnName}
join ${sqlInfo.foreignTableName} on ${sqlInfo.foreignTableName}.${sqlInfo.foreignColumnName} = ${joinTableTableName}.${createManyToManyJoinTableFieldRef2ColumnName(relation)}
where ${sqlInfo.localTableName}.id = $1`
  )
}

export const createManyToManyFieldRef2RelationSelectSql = <
  T extends DataFormatDeclarations,
>(
    dataFormats: DataFormatsDict<T>,
    relation: Relation<T, RelationType.MANY_TO_MANY, RelationDeclaration<T, RelationType.MANY_TO_MANY>>,
  ) => {
  const sqlInfo = getSqlInformation(dataFormats, relation.fieldRef2, relation.fieldRef1)
  const joinTableTableName = relation.sql.joinTableName

  return (
    `select ${sqlInfo.foreignColumnsSql} from ${sqlInfo.localTableName}
join ${joinTableTableName} on ${joinTableTableName}.${createManyToManyJoinTableFieldRef2ColumnName(relation)} = ${sqlInfo.localTableName}.${sqlInfo.localColumnName}
join ${sqlInfo.foreignTableName} on ${sqlInfo.foreignTableName}.${sqlInfo.foreignColumnName} = ${joinTableTableName}.${createManyToManyJoinTableFieldRef1ColumnName(relation)}
where ${sqlInfo.localTableName}.id = $1`
  )
}
