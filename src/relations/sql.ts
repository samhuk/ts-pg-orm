import { camelCaseToSnakeCase } from '../helpers/string'
import { DataFormatDeclarations, FieldRef } from '../dataFormat/types'
import { RelationDeclaration, RelationType } from './types'

export const createManyToManyJoinTableName = (r: RelationDeclaration<DataFormatDeclarations, RelationType.MANY_TO_MANY>) => {
  const tableName1 = camelCaseToSnakeCase(r.fieldRef1.formatName)
  const tableName2 = camelCaseToSnakeCase(r.fieldRef2.formatName)
  return `${tableName1}_to_${tableName2}`
}

export const createManyToManyJoinTableFieldRefColumnName = (fieldRef: FieldRef) => {
  const tableName = camelCaseToSnakeCase(fieldRef.formatName)
  const fieldName = camelCaseToSnakeCase(fieldRef.fieldName)
  return `${tableName}_${fieldName}`
}

/**
 * Creates the join table "create table" sql text required for the
 * given many-to-many relation.
 */
export const createManyToManyJoinTableSql = (r: RelationDeclaration<DataFormatDeclarations, RelationType.MANY_TO_MANY>) => {
  const tableName1 = camelCaseToSnakeCase(r.fieldRef1.formatName)
  const tableName2 = camelCaseToSnakeCase(r.fieldRef2.formatName)
  const fieldName1 = camelCaseToSnakeCase(r.fieldRef1.fieldName)
  const fieldName2 = camelCaseToSnakeCase(r.fieldRef2.fieldName)
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
    ${(r.includeDateCreated ?? false) ? 'date_created not null default CURRENT_TIMESTAMP,' : ''}
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
  const localTableName = camelCaseToSnakeCase(localFieldRef.formatName)
  const foreignTableName = camelCaseToSnakeCase(foreignFieldRef.formatName)
  const localColumnName = camelCaseToSnakeCase(localFieldRef.fieldName)
  const foreignColumnName = camelCaseToSnakeCase(foreignFieldRef.fieldName)
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
export const createOneToManyForeignKeySql = (r: RelationDeclaration<DataFormatDeclarations, RelationType.ONE_TO_MANY>) => (
  createForeignKeySql(
    r.toManyField,
    r.fromOneField,
  )
)

/**
 * Creates the "constraint ... foreign key (...)" sql text required for the
 * given one-to-one relation.
 */
export const createOneToOneForeignKeySql = (r: RelationDeclaration<DataFormatDeclarations, RelationType.ONE_TO_ONE>) => (
  createForeignKeySql(
    r.toOneField,
    r.fromOneField,
  )
)
