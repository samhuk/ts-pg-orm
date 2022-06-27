# ts-entity-framework

A package for creating data formats and relations with strict type enforcement and transformations to PostgreSQL SQL statements.

## What and Why?

There has always been an inconvenient separation between Typescript types and the Javascript code that operates on them. Without code repetition, lots of constants, or otherwise cumbersome workarounds, one cannot easily nor scalably attach metadata to properties of types; one cannot iterate over the fields and perform particular operations for each one, one cannot do a lot.

Non-native solutions to this problem typically use a *type-to-Javascript* approach to expose types to Javascript code, which typically involves either custom Typescript transformers or a new language with its own compiler down to Typescript.

`ts-entity-framework` takes the opposite approach - `Javascript-to-type`. This package allows you to define "Data Format Declarations" in Javascript (essentially a list of fields with metadata), with the one-liner ability to turn them into various types. This approach requires only native Javascript and Typescript functionality.

## Usage

Create data formats:

```typescript
import { createDataFormatDeclaration } from 'ts-entity-framework/dist/dataFormat'
import { DataType, NumberDataSubType, StringDataSubType } from 'ts-entity-framework/dist/dataFormat/types'

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

Load data formats and relations between them to create entities:

```typescript
import { createEntities } from 'ts-entity-framework'
import { RelationType } from 'ts-entity-framework/dist/relations/types'

const ENTITIES = createEntities()
  .loadDataFormats([
    USER_DFD,
    USER_GROUP_DFD
  ] as const)
  .loadRelations(dfs => [
    // Create many-to-many relation between user and userGroup entities
    {
      type: RelationType.MANY_TO_MANY,
      fieldRef1: dfs.user.fieldRefs.id,
      fieldRef2: dfs.userGroup.fieldRefs.id,
      getRelatedFieldRef1RecordsStoreName: 'getUsersOfUserGroup',
      getRelatedFieldRef2RecordsStoreName: 'getUserGroupsOfUser',
    },
  ] as const)
```

Create types:

```typescript
import { DataFormatDeclarationToRecord, CreateRecordOptions } from 'ts-entity-framework/dist/dataFormat/types'

export type UserRecord = DataFormatDeclarationToRecord<typeof USER_DFD>
// { id: number, name: string }

export type CreateUserRecordOptions = CreateRecordOptions<typeof USER_DFD>
// { name: string }

export type UserGroupRecord = DataFormatDeclarationToRecord<typeof USER_GROUP_DFD>
// { id: number, name: string }
```

Create PostgreSQL stores for entities:

```typescript
// Provide own db service
const baseUserDbStore = ENTITIES.sqldb.createEntityDbStore('user', dbService)
const baseUserGroupDbStore = ENTITIES.sqldb.createEntityDbStore('userGroup', dbService)
// Create join tables (a.k.a "junction table") for all many-to-many relations, i.e. user_to_user_group
await ENTITIES.sqldb.createJoinTables(dbService)
// Create entity tables
await baseUserDbStore.provision()
await baseUserGroupDbStore.provision()
```

Use created types and stores in your application, all fully type-enforced!:

```typescript
// Perform CRUD operations on entities
const createUserOptions: CreateUserRecordOptions = { name: 'newUser' }
const user: UserRecord = await baseUserDbStore.add(createUserOptions)
// Get related entity data according to data formats and relations
const userGroups = await baseUserDbStore.getUserGroupsOfUser(user.id)
// Use data format sql information to create type-enforced SQL statements
const userSqlInfo = ENTITIES.dataFormats.user.sql
const customUserSql = `select ${userSqlInfo.columnNames.name} from` /* ... */
// And so on...
```

## Development

`ts-entity-framework` is currently in an early state of development, primarily being used as a provider of PostgreSQL stores for data formats with simple data types (i.e. string, number, date, jsonb). More PostgreSQL data types or transformations to other SQL databases altogether could be added later as per need or request.