# ts-pg-orm

**ts-pg-orm is in early development**

![build](https://github.com/samhuk/ts-pg-orm/actions/workflows/build.yaml/badge.svg)
![MIT License](https://img.shields.io/badge/License-MIT-green.svg)

Typescript PostgreSQL ORM.

A package for creating data formats, relations, and postgresql data stores with full Typescript enforcement.

## Usage

Define your Data Format Declarations:

```typescript
import { createDataFormatDeclaration } from 'ts-pg-orm/dist/dataFormat'
import { DataType, NumberDataSubType, StringDataSubType } from 'ts-pg-orm/dist/dataFormat/types'

export const USER_DFD = createDataFormatDeclaration({
  name: 'user',
  fields: [
    { name: 'id', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.SERIAL },
    { name: 'name', dataType: DataType.STRING, dataSubType: StringDataSubType.VARYING_LENGTH, maxLength: 50 },
  ],
} as const)

export const USER_GROUP_DFD = createDataFormatDeclaration({
  name: 'userGroup',
  fields: [
    { name: 'id', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.SERIAL },
    { name: 'name', dataType: DataType.STRING, dataSubType: StringDataSubType.VARYING_LENGTH, maxLength: 50 },
  ],
} as const)
```

Create types from your Data Format Declarations:

```typescript
import { ToRecord, CreateRecordOptions } from 'ts-pg-orm/dist/dataFormat/types'

export type UserRecord = ToRecord<typeof USER_DFD>
// { id: number, name: string }

export type CreateUserRecordOptions = CreateRecordOptions<typeof USER_DFD>
// { name: string }

export type UserGroupRecord = ToRecord<typeof USER_GROUP_DFD>
// { id: number, name: string }
```

Load Data Format Declarations and Relations to create Entities:

```typescript
import { createEntities } from 'ts-pg-orm'
import { RelationType } from 'ts-pg-orm/dist/relations/types'

const ENTITIES = createEntities()
  .loadDataFormats([
    USER_DFD,
    USER_GROUP_DFD
  ] as const)
  .loadRelations(dfs => [
    // Create many-to-many relation between user and userGroup entities, linked on id fields.
    {
      type: RelationType.MANY_TO_MANY,
      fieldRef1: dfs.user.fieldRefs.id,
      fieldRef2: dfs.userGroup.fieldRefs.id
    },
  ] as const)
```

Create and provision PostgreSQL entity stores:

```typescript
import { DbService } from 'ts-pg-orm/dist/dataFormat/types'
// Define PostgreSql DB service, with query, queryGetFirstRow, and queryGetRows functions.
const dbService: DbService = { ... }
// Create and provision DB stores for entities
const stores = ENTITIES.sqldb.createAndProvisionStores(dbService, ['user', 'userGroup'])
// Create any join (a.k.a "junction") tables for many-to-many relations, i.e. user_to_user_group
await ENTITIES.sqldb.createJoinTables(dbService)
```

Use types and stores throughout your application, all fully type-enforced:

```typescript
import { Operator } from '@samhuk/data-filter/dist/types'
// Use types
const createUserOptions: CreateUserRecordOptions = { name: 'newUser' }
// Create records
const user: UserRecord = await stores.user.create(createUserOptions)
// Get records by data filters and queries, with related data, recursively.
const user = await stores.user.getSingle({
  fields: ['name'],
  filter: { field: 'id', op: Operator.EQUALS, val: 1 },
  relations: {
    userGroups: {
      query: {
        page: 1,
        pageSize: 5,
        sorting: [{ field: 'name', dir: SortingDirection.DESC }],
        filter: { field: 'name', op: Operator.NOT_EQUALS, val: null },
      },
    },
  },
})
// Use type-enforced data format sql information to create bespoke SQL statements
const sql = ENTITIES.dataFormats.user.sql
// E.g. select name from "user"
const customUserSql = `select ${sql.columnNames.name} from ${sql.tableName}`
```

## Examples

Examples can be found within ./src/examples, showing more complete and realistic usages.

### Article API

This is a simple single-endpoint api that has two entities - "User" and "UserArticle", with a single relation linking them.

Run `npm run start-article-api` to build and start the server (don't forget to run `npm i` first if you have not already). Once running, try sending a HTTP GET request to http://localhost:3000/userProfile/1.

## Development

`ts-pg-orm` is currently in an early state of development, primarily being used as a provider of PostgreSQL stores for data formats with simple data types (i.e. string, number, date, jsonb). More PostgreSQL data types or transformations to other SQL databases altogether could be added later as per need or request.
