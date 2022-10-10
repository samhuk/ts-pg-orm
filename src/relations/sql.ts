import { camelCaseToSnakeCase, quote } from '../helpers/string'
import { FieldRef } from '../dataFormat/types/fieldRef'
import { RelationType, RelationOptions, ResovledRelationInfo } from './types'
import { DataFormat, DataFormats } from '../dataFormat/types'
import { ManyToManyRelationSql, NonManyToManyRelationSql } from './types/sql'
import { Field } from '../dataFormat/types/field'

type ResovledFieldRefs = {
  localDataFormat: DataFormat
  foreignDataFormat: DataFormat
  localField: Field
  foreignField: Field
}

const createForeignKeyName = (resolvedFieldRefs: ResovledFieldRefs) => (
  // E.g. image_to_user_creator_user_id_fkey
  `${resolvedFieldRefs.localDataFormat.sql.unquotedTableName}_to_${resolvedFieldRefs.foreignDataFormat.sql.unquotedTableName}_${resolvedFieldRefs.localField.sql.unquotedColumnName}_fkey`
)

const resolveFieldRefs = (
  dataFormats: DataFormats,
  localFieldRef: FieldRef,
  foreignFieldRef: FieldRef,
): ResovledFieldRefs => {
  const localDataFormat = dataFormats[localFieldRef.dataFormat]
  const foreignDataFormat = dataFormats[foreignFieldRef.dataFormat]
  return {
    localDataFormat,
    foreignDataFormat,
    localField: localDataFormat.fields[localFieldRef.field],
    foreignField: foreignDataFormat.fields[foreignFieldRef.field],
  }
}

const createForeignKeySql = (
  resolvedFieldRefs: ResovledFieldRefs,
  foreignKeyName: string,
) => {
  const localTableName = resolvedFieldRefs.localDataFormat.sql.tableName
  const unquotedForeignTableName = resolvedFieldRefs.foreignDataFormat.sql.unquotedTableName
  const unquotedLocalColumnName = resolvedFieldRefs.localField.sql.unquotedColumnName
  const unquotedForeignColumnName = resolvedFieldRefs.foreignField.sql.unquotedColumnName
  return (
    `alter table ${localTableName} add constraint ${foreignKeyName} foreign key (${unquotedLocalColumnName})
    references public.${unquotedForeignTableName} (${unquotedForeignColumnName}) match simple
    on update no action
    on delete no action;`
  )
}

export const createOneToManyRelationSql = (
  dataFormats: DataFormats,
  relationOptions: RelationOptions<RelationType.ONE_TO_MANY>,
): NonManyToManyRelationSql => {
  const resolvedFieldRefs = resolveFieldRefs(dataFormats, relationOptions.toManyField, relationOptions.fromOneField)
  const foreignKeyName = createForeignKeyName(resolvedFieldRefs)

  return {
    foreignKeyName,
    foreignKeySql: createForeignKeySql(resolvedFieldRefs, foreignKeyName),
  }
}

export const createOneToOneRelationSql = (
  dataFormats: DataFormats,
  relationOptions: RelationOptions<RelationType.ONE_TO_ONE>,
): NonManyToManyRelationSql => {
  const resolvedFieldRefs = resolveFieldRefs(dataFormats, relationOptions.toOneField, relationOptions.fromOneField)
  const foreignKeyName = createForeignKeyName(resolvedFieldRefs)

  return {
    foreignKeyName,
    foreignKeySql: createForeignKeySql(resolvedFieldRefs, foreignKeyName),
  }
}

/**
 * Creates the join table "create table" sql text required for the
 * given many-to-many relation.
 */
export const createManyToManyJoinTableSql = (
  relationOptions: RelationOptions<RelationType.MANY_TO_MANY>,
  info: ResovledRelationInfo,
  unquotedJoinTableName: string,
  joinTableName: string,
  unquotedLeftJoinTableColumnName: string,
  unquotedRightJoinTableColumnName: string,
) => {
  const tableName1 = info.leftDataFormat.sql.tableName // E.g. "user"
  const tableName2 = info.rightDataFormat.sql.tableName // E.g. "user_group"
  const fieldName1 = info.leftField.sql.columnName // E.g. "id"
  const fieldName2 = info.rightField.sql.columnName // E.g. "id"

  // E.g. user_to_user_group_user_id_fkey
  const fkeyName1 = `${unquotedJoinTableName}_${unquotedLeftJoinTableColumnName}_fkey`
  // E.g. user_to_user_group_user_group_id_fkey
  const fkeyName2 = `${unquotedJoinTableName}_${unquotedRightJoinTableColumnName}_fkey`

  return (
    `create table if not exists public.${joinTableName}
(
    id serial primary key,
    ${unquotedLeftJoinTableColumnName} integer not null,
    ${unquotedRightJoinTableColumnName} integer not null,
    ${(relationOptions.includeDateCreated ?? false) ? 'date_created timestamp with time zone not null default CURRENT_TIMESTAMP,' : ''}
    constraint ${fkeyName1} foreign key (${unquotedLeftJoinTableColumnName})
        references public.${tableName1} (${fieldName1}) match simple
        ${(relationOptions.fieldRef1OnUpdateNoAction ?? true) ? 'on update no action' : ''}
        ${(relationOptions.fieldRef1OnDeleteNoAction ?? true) ? 'on delete no action' : ''},
    constraint ${fkeyName2} foreign key (${unquotedRightJoinTableColumnName})
        references public.${tableName2} (${fieldName2}) match simple
        ${(relationOptions.fieldRef2OnUpdateNoAction ?? true) ? 'on update no action' : ''}
        ${(relationOptions.fieldRef2OnDeleteNoAction ?? true) ? 'on delete no action' : ''}
)

tablespace pg_default;

alter table if exists public.${joinTableName}
    owner to postgres;`
  )
}

export const createManyToManyRelationSql = (
  relationOptions: RelationOptions<RelationType.MANY_TO_MANY>,
  resolvedRelationInfo: ResovledRelationInfo,
): ManyToManyRelationSql => {
  // E.g. user_to_user_group
  const unquotedJoinTableName = `${resolvedRelationInfo.leftDataFormat.sql.unquotedTableName}_to_${resolvedRelationInfo.rightDataFormat.sql.unquotedTableName}`
  const joinTableName = quote(unquotedJoinTableName)
  // E.g. user_id
  const unquotedJoinTableFieldRef1ColumnName = `${resolvedRelationInfo.leftDataFormat.sql.unquotedTableName}_${resolvedRelationInfo.leftField.sql.unquotedColumnName}`
  // E.g. user_group_id
  const unquotedJoinTableFieldRef2ColumnName = `${resolvedRelationInfo.rightDataFormat.sql.unquotedTableName}_${resolvedRelationInfo.rightField.sql.unquotedColumnName}`

  return {
    // eslint-disable-next-line max-len
    createJoinTableSql: createManyToManyJoinTableSql(relationOptions, resolvedRelationInfo, unquotedJoinTableName, joinTableName, unquotedJoinTableFieldRef1ColumnName, unquotedJoinTableFieldRef2ColumnName),
    dropJoinTableSql: `drop table if exists ${joinTableName};`,
    unquotedJoinTableFieldRef1ColumnName,
    joinTableFieldRef1ColumnName: quote(unquotedJoinTableFieldRef1ColumnName),
    unquotedJoinTableFieldRef2ColumnName,
    joinTableFieldRef2ColumnName: quote(unquotedJoinTableFieldRef2ColumnName),
    unquotedJoinTableName,
    joinTableName,
  }
}
