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

Load Data Format Declarations and Relations to create an instance of TsPgOrm:

```typescript
import { createTsPgOrm } from 'ts-pg-orm'
import { RelationType } from 'ts-pg-orm/dist/relations/types'

const ORM = createTsPgOrm()
  .loadDataFormats([
    USER_DFD,
    USER_GROUP_DFD
  ] as const)
  .loadRelations(dfs => [
    {
      type: RelationType.MANY_TO_MANY,
      fieldRef1: dfs.user.fieldRefs.id,
      fieldRef2: dfs.userGroup.fieldRefs.id
    },
  ] as const)
```

Create and provision stores with PostgreSQL backing:

```typescript
await ORM.initDbClient({ host: 'localhost', port: 5432, ... })
const stores = await ORM.createStores()
```

Use stores, all fully type-enforced according to the Data Format Declarations and Relations that were loaded:

```typescript
import { Operator } from '@samhuk/data-filter/dist/types'
const userCreated = await stores.user.create({ name: 'newUser' })
const userFound = await stores.user.getSingle({
  fields: ['name'],
  filter: { field: 'id', op: Operator.EQUALS, val: 1 },
  relations: {
    userGroups: {
      query: { ... },
    },
  },
})
await stores.user.updateSingle({ 
  filter: { ... },
  record: { name: 'newNewUser' }
})
// Use type-enforced data format sql information to create bespoke SQL statements
const sql = ORM.dataFormats.user.sql
const customUserSql = `select ${sql.columnNames.name} from ${sql.tableName}`
```

Create types from your Data Format Declarations, to use throughout your app:

```typescript
import { ToRecord, CreateRecordOptions } from 'ts-pg-orm/dist/dataFormat/types'

export type UserRecord = ToRecord<typeof USER_DFD>
// { id: number, name: string }
export type CreateUserRecordOptions = CreateRecordOptions<typeof USER_DFD>
// { name: string }
export type UserGroupRecord = ToRecord<typeof USER_GROUP_DFD>
// { id: number, name: string }
```

## Examples

Examples can be found within ./src/examples, showing more complete and realistic usages.

### Article API

This is a simple single-endpoint api that has two data formats - "User" and "UserArticle", with a single relation linking them.

Run `npm run article-api` to build and start the server (don't forget to run `npm i` first if you have not already). Once running, try sending a HTTP GET request to http://localhost:3000/userProfile/1.

### Real DB Test

This connects to a real PostgreSQL server at (by default) postgres@localhost:5432 and sets up a new ts-pg-orm instance with some sample data formats and relations, making queries to retreive records with related data.

Run `npm run real-db-test` to build and run this.

## Development

`ts-pg-orm` is currently in an early state of development, primarily being used as a provider of PostgreSQL stores for data formats with simple data types (i.e. string, number, date, jsonb). More PostgreSQL data types or transformations to other SQL databases altogether could be added later as per need or request.
