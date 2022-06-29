import { DataFormat, DataFormatDeclarations, DataFormatsDict } from '../../dataFormat/types'
import { createManyToManyJoinTableFieldRef2ColumnName, createManyToManyJoinTableFieldRef1ColumnName } from '../../relations/sql'
import { Relation, RelationDeclaration, RelationType } from '../../relations/types'

export const createOneToOneFromOneRelationSelectSql = <
  T extends DataFormatDeclarations,
>(
    dataFormats: DataFormatsDict<T>,
    relation: Relation<T, RelationType.ONE_TO_ONE, RelationDeclaration<T, RelationType.ONE_TO_ONE>>,
  ) => {
  // @ts-ignore
  const localDataFormat = dataFormats[relation.fromOneField.formatName] as DataFormat
  const localTableName = localDataFormat.sql.tableName
  const localColumnName = localDataFormat.sql.columnNames[relation.fromOneField.fieldName]

  // @ts-ignore
  const foreignDataFormat = dataFormats[relation.toOneField.formatName] as DataFormat
  const foreignTableName = foreignDataFormat.sql.tableName
  const foreignColumnName = foreignDataFormat.sql.columnNames[relation.toOneField.fieldName]
  const foreignColumnsSql = foreignDataFormat.sql.columnNameList
    .map(columnName => `${foreignTableName}.${columnName}`)
    .join(', ')

  return `select ${foreignColumnsSql} from ${localTableName}
join ${foreignTableName} on ${foreignTableName}.${foreignColumnName} = ${localTableName}.${localColumnName}
where ${localTableName}.id = $1 limit 1`
}

export const createOneToOneToOneRelationSelectSql = <
  T extends DataFormatDeclarations,
>(
    dataFormats: DataFormatsDict<T>,
    relation: Relation<T, RelationType.ONE_TO_ONE, RelationDeclaration<T, RelationType.ONE_TO_ONE>>,
  ) => {
  // @ts-ignore
  const localDataFormat = dataFormats[relation.toOneField.formatName] as DataFormat
  const localTableName = localDataFormat.sql.tableName
  const localColumnName = localDataFormat.sql.columnNames[relation.toOneField.fieldName]

  // @ts-ignore
  const foreignDataFormat = dataFormats[relation.fromOneField.formatName] as DataFormat
  const foreignTableName = foreignDataFormat.sql.tableName
  const foreignColumnName = foreignDataFormat.sql.columnNames[relation.fromOneField.fieldName]
  const foreignColumnsSql = foreignDataFormat.sql.columnNameList
    .map(columnName => `${foreignTableName}.${columnName}`)
    .join(', ')

  return `select ${foreignColumnsSql} from ${localTableName}
join ${foreignTableName} on ${foreignTableName}.${foreignColumnName} = ${localTableName}.${localColumnName}
where ${localTableName}.id = $1 limit 1`
}

export const createOneToManyFromOneRelationSelectSql = <
  T extends DataFormatDeclarations,
>(
    dataFormats: DataFormatsDict<T>,
    relation: Relation<T, RelationType.ONE_TO_MANY, RelationDeclaration<T, RelationType.ONE_TO_MANY>>,
  ) => {
  // @ts-ignore
  const localDataFormat = dataFormats[relation.fromOneField.formatName] as DataFormat
  const localTableName = localDataFormat.sql.tableName
  const localColumnName = localDataFormat.sql.columnNames[relation.fromOneField.fieldName]

  // @ts-ignore
  const foreignDataFormat = dataFormats[relation.toManyField.formatName] as DataFormat
  const foreignTableName = foreignDataFormat.sql.tableName
  const foreignColumnName = foreignDataFormat.sql.columnNames[relation.toManyField.fieldName]
  const foreignColumnsSql = foreignDataFormat.sql.columnNameList
    .map(columnName => `${foreignTableName}.${columnName}`)
    .join(', ')

  return `select ${foreignColumnsSql} from ${localTableName}
join ${foreignTableName} on ${foreignTableName}.${foreignColumnName} = ${localTableName}.${localColumnName}
where ${localTableName}.id = $1`
}

export const createOneToManyToManyRelationSelectSql = <
  T extends DataFormatDeclarations,
>(
    dataFormats: DataFormatsDict<T>,
    relation: Relation<T, RelationType.ONE_TO_MANY, RelationDeclaration<T, RelationType.ONE_TO_MANY>>,
  ) => {
  // @ts-ignore
  const localDataFormat = dataFormats[relation.toManyField.formatName] as DataFormat
  const localTableName = localDataFormat.sql.tableName
  const localColumnName = localDataFormat.sql.columnNames[relation.toManyField.fieldName]

  // @ts-ignore
  const foreignDataFormat = dataFormats[relation.fromOneField.formatName] as DataFormat
  const foreignTableName = foreignDataFormat.sql.tableName
  const foreignColumnName = foreignDataFormat.sql.columnNames[relation.fromOneField.fieldName]
  const foreignColumnsSql = foreignDataFormat.sql.columnNameList
    .map(columnName => `${foreignTableName}.${columnName}`)
    .join(', ')

  return `select ${foreignColumnsSql} from ${localTableName}
join ${foreignTableName} on ${foreignTableName}.${foreignColumnName} = ${localTableName}.${localColumnName}
where ${localTableName}.id = $1 limit 1`
}

export const createManyToManyFieldRef1RelationSelectSql = <
  T extends DataFormatDeclarations,
>(
    dataFormats: DataFormatsDict<T>,
    relation: Relation<T, RelationType.MANY_TO_MANY, RelationDeclaration<T, RelationType.MANY_TO_MANY>>,
  ) => {
  // @ts-ignore
  const localDataFormat = dataFormats[relation.fieldRef1.formatName] as DataFormat
  const localTableName = localDataFormat.sql.tableName
  const localColumnName = localDataFormat.sql.columnNames[relation.fieldRef1.fieldName]

  // @ts-ignore
  const foreignDataFormat = dataFormats[relation.fieldRef2.formatName] as DataFormat
  const foreignTableName = foreignDataFormat.sql.tableName
  const foreignColumnName = foreignDataFormat.sql.columnNames[relation.fieldRef2.fieldName]
  const foreignColumnsSql = foreignDataFormat.sql.columnNameList
    .map(columnName => `${foreignTableName}.${columnName}`)
    .join(', ')

  const joinTableTableName = relation.sql.joinTableName

  return (
    `select ${foreignColumnsSql} from ${localTableName}
join ${joinTableTableName} on ${joinTableTableName}.${createManyToManyJoinTableFieldRef1ColumnName(relation)} = ${localTableName}.${localColumnName}
join ${foreignTableName} on ${foreignTableName}.${foreignColumnName} = ${joinTableTableName}.${createManyToManyJoinTableFieldRef2ColumnName(relation)}
where ${localTableName}.id = $1`
  )
}

export const createManyToManyFieldRef2RelationSelectSql = <
  T extends DataFormatDeclarations,
>(
    dataFormats: DataFormatsDict<T>,
    relation: Relation<T, RelationType.MANY_TO_MANY, RelationDeclaration<T, RelationType.MANY_TO_MANY>>,
  ) => {
  // @ts-ignore
  const localDataFormat = dataFormats[relation.fieldRef2.formatName] as DataFormat
  const localTableName = localDataFormat.sql.tableName
  const localColumnName = localDataFormat.sql.columnNames[relation.fieldRef2.fieldName]

  // @ts-ignore
  const foreignDataFormat = dataFormats[relation.fieldRef1.formatName] as DataFormat
  const foreignTableName = foreignDataFormat.sql.tableName
  const foreignColumnName = foreignDataFormat.sql.columnNames[relation.fieldRef1.fieldName]
  const foreignColumnsSql = foreignDataFormat.sql.columnNameList
    .map(columnName => `${foreignTableName}.${columnName}`)
    .join(', ')

  const joinTableTableName = relation.sql.joinTableName

  return (
    `select ${foreignColumnsSql} from ${localTableName}
join ${joinTableTableName} on ${joinTableTableName}.${createManyToManyJoinTableFieldRef2ColumnName(relation)} = ${localTableName}.${localColumnName}
join ${foreignTableName} on ${foreignTableName}.${foreignColumnName} = ${joinTableTableName}.${createManyToManyJoinTableFieldRef1ColumnName(relation)}
where ${localTableName}.id = $1`
  )
}
