# ts-entity-framework

A package for creating data formats and relations with strict type enforcement and transformations to PostgreSQL SQL statements.

## What and Why?

There has always been an inconvenient separation between Typescript types and the Javascript code that operates on them. Without repetition, coupling, constants, and/or otherwise cumbersome workarounds, one cannot easily attach metadata to type properties or iterate over them and perform particular operations on them.

Non-native solutions to this often use a *type-to-Javascript* approach to expose types to Javascript code, which typically involves either custom Typescript transformers or a new language with its own compiler down to Typescript.

`ts-entity-framework` takes the opposite approach - *Javascript-to-type*, allowing one to define "Data Format Declarations" in Javascript (essentially a list of fields with metadata), with the one-liner ability to turn them into various types. This approach requires only native JS and TS functionality.

## Usage

Create Data Format Declarations:

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

Create types from Data Format Declarations:

```typescript
import { DataFormatDeclarationToRecord, CreateRecordOptions } from 'ts-entity-framework/dist/dataFormat/types'

export type UserRecord = DataFormatDeclarationToRecord<typeof USER_DFD>
// { id: number, name: string }

export type CreateUserRecordOptions = CreateRecordOptions<typeof USER_DFD>
// { name: string }

export type UserGroupRecord = DataFormatDeclarationToRecord<typeof USER_GROUP_DFD>
// { id: number, name: string }
```

Load Data Format Declarations and Relations to create entities:

```typescript
import { createEntities } from 'ts-entity-framework'
import { RelationType } from 'ts-entity-framework/dist/relations/types'

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

Create and provision PostgreSQL stores for entities:

```typescript
import { DbService } from 'ts-entity-framework/dist/dataFormat/types'
// Define PostgreSql DB service, with query, queryGetFirstRow, and queryGetRows functions.
const dbService: DbService = { ... }
// Create DB stores for entities
const userDbStore = ENTITIES.sqldb.createEntityDbStore('user', dbService)
const userGroupDbStore = ENTITIES.sqldb.createEntityDbStore('userGroup', dbService)
// Create join table (a.k.a "junction table") for many-to-many relations, i.e. user_to_user_group
await ENTITIES.sqldb.createJoinTables(dbService)
// Create entity tables
await userDbStore.provision()
await userGroupDbStore.provision()
```

Use types and stores throughout your application, all fully type-enforced!:

```typescript
// Perform CRUD operations on entities
const createUserOptions: CreateUserRecordOptions = { name: 'newUser' }
// Get entity record
const user: UserRecord = await userDbStore.add(createUserOptions)
// Get related entity records
const userGroups = await userDbStore.getUserGroupsOfUser(user.id)
// Get entity record with all related entity records
const userWithUserGroups = await userDbStore.getByIdWithAllRelations(user.id)
// Get entity record with some related entity records
const userWithUserGroups = await userDbStore.getByIdWithRelations(user.id, ['userGroups'])
// Use data format sql information to create custom type-enforced SQL statements
const userSqlInfo = ENTITIES.dataFormats.user.sql
const customUserSql = `select ${userSqlInfo.columnNames.name} from ${userSqlInfo.tableName}`
// select name from "user"
```

## Development

`ts-entity-framework` is currently in an early state of development, primarily being used as a provider of PostgreSQL stores for data formats with simple data types (i.e. string, number, date, jsonb). More PostgreSQL data types or transformations to other SQL databases altogether could be added later as per need or request.