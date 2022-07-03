import { entities } from '../testData'
import { convertDataFormatDeclarationToCreateTableSql } from './sql'

describe('sql', () => {
  describe('convertDataFormatDeclarationToCreateTableSql', () => {
    const fn = convertDataFormatDeclarationToCreateTableSql

    test('test 1 - user', () => {
      const sql = fn(entities.dataFormats.user.declaration)
      expect(sql).toBe(`create table if not exists public."user"
(
  id serial not null primary key,
  name character varying(50) not null
)

tablespace pg_default;

alter table if exists public."user"
  owner to postgres;`)
    })

    test('test 1 - recipe', () => {
      const sql = fn(entities.dataFormats.recipe.declaration, [entities.relations['user.id <-->> recipe.createdByUserId']])
      expect(sql).toBe(`create table if not exists public."recipe"
(
  id serial not null primary key,
  created_by_user_id integer,
  constraint recipe_to_user_created_by_user_id_fkey foreign key (created_by_user_id)
    references public.user (id) match simple
    on update no action
    on delete no action
)

tablespace pg_default;

alter table if exists public."recipe"
  owner to postgres;`)
    })

    test('test 1 - user address', () => {
      const sql = fn(entities.dataFormats.userAddress.declaration, [entities.relations['user.id <--> userAddress.userId']])
      expect(sql).toBe(`create table if not exists public."user_address"
(
  user_id integer unique,
  street_address character varying(200) not null,
  post_code character varying(10) not null,
  constraint user_address_to_user_user_id_fkey foreign key (user_id)
    references public.user (id) match simple
    on update no action
    on delete no action
)

tablespace pg_default;

alter table if exists public."user_address"
  owner to postgres;`)
    })

    test('test 1 - user group', () => {
      const sql = fn(entities.dataFormats.userGroup.declaration)
      expect(sql).toBe(`create table if not exists public."user_group"
(
  id serial not null primary key,
  name character varying(50) not null
)

tablespace pg_default;

alter table if exists public."user_group"
  owner to postgres;`)
    })
  })
})
