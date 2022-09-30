import { camelCaseToSnakeCase } from '../../helpers/string'
import { FieldRef } from '../dataFormat/types/fieldRef'
import { RelationType, RelationOptions } from './types'

export const createManyToManyJoinTableName = (r: RelationOptions<RelationType.MANY_TO_MANY>) => {
  const tableName1 = camelCaseToSnakeCase(r.fieldRef1.dataFormat)
  const tableName2 = camelCaseToSnakeCase(r.fieldRef2.dataFormat)
  return `${tableName1}_to_${tableName2}`
}

export const createManyToManyJoinTableFieldRefColumnName = (fieldRef: FieldRef) => {
  const tableName = camelCaseToSnakeCase(fieldRef.dataFormat)
  const fieldName = camelCaseToSnakeCase(fieldRef.field)
  return `${tableName}_${fieldName}`
}

/**
 * Creates the join table "create table" sql text required for the
 * given many-to-many relation.
 */
export const createManyToManyJoinTableSql = (r: RelationOptions<RelationType.MANY_TO_MANY>) => {
  const tableName1 = camelCaseToSnakeCase(r.fieldRef1.dataFormat)
  const tableName2 = camelCaseToSnakeCase(r.fieldRef2.dataFormat)
  const fieldName1 = camelCaseToSnakeCase(r.fieldRef1.field)
  const fieldName2 = camelCaseToSnakeCase(r.fieldRef2.field)
  const columnName1 = createManyToManyJoinTableFieldRefColumnName(r.fieldRef1)
  const columnName2 = createManyToManyJoinTableFieldRefColumnName(r.fieldRef2)

  const tableName = `${tableName1}_to_${tableName2}`

  const fkeyName1 = `${tableName}_${columnName1}_fkey`
  const fkeyName2 = `${tableName}_${columnName2}_fkey`

  return (
    `create table if not exists public.${tableName}
(
    id serial primary key,
    ${columnName1} integer not null,
    ${columnName2} integer not null,
    ${(r.includeDateCreated ?? false) ? 'date_created timestamp with time zone not null default CURRENT_TIMESTAMP,' : ''}
    constraint ${fkeyName1} foreign key (${columnName1})
        references public.${tableName1} (${fieldName1}) match simple
        ${(r.fieldRef1OnUpdateNoAction ?? true) ? 'on update no action' : ''}
        ${(r.fieldRef1OnDeleteNoAction ?? true) ? 'on delete no action' : ''},
    constraint ${fkeyName2} foreign key (${columnName2})
        references public.${tableName2} (${fieldName2}) match simple
        ${(r.fieldRef2OnUpdateNoAction ?? true) ? 'on update no action' : ''}
        ${(r.fieldRef2OnDeleteNoAction ?? true) ? 'on delete no action' : ''}
)

tablespace pg_default;

alter table if exists public.${tableName}
    OWNER to postgres;`
  )
}

const createForeignKeySql = (
  localFieldRef: FieldRef,
  foreignFieldRef: FieldRef,
) => {
  const localTableName = camelCaseToSnakeCase(localFieldRef.dataFormat)
  const foreignTableName = camelCaseToSnakeCase(foreignFieldRef.dataFormat)
  const localColumnName = camelCaseToSnakeCase(localFieldRef.field)
  const foreignColumnName = camelCaseToSnakeCase(foreignFieldRef.field)
  const foreignKeyName = `${localTableName}_to_${foreignTableName}_${localColumnName}_fkey`
  return (
    `  constraint ${foreignKeyName} foreign key (${localColumnName})
    references public.${foreignTableName} (${foreignColumnName}) match simple
    on update no action
    on delete no action`
  )
}

/**
 * Creates the "constraint ... foreign key (...)" sql text required for the
 * given one-to-many relation.
 */
export const createOneToManyForeignKeySql = (r: RelationOptions<RelationType.ONE_TO_MANY>) => (
  createForeignKeySql(
    r.toManyField,
    r.fromOneField,
  )
)

/**
 * Creates the "constraint ... foreign key (...)" sql text required for the
 * given one-to-one relation.
 */
export const createOneToOneForeignKeySql = (r: RelationOptions<RelationType.ONE_TO_ONE>) => (
  createForeignKeySql(
    r.toOneField,
    r.fromOneField,
  )
)
