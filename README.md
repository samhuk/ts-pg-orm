# ts-entity-framework

A package for creating data formats and relations with strict type enforcement and transformations to PostgreSQL SQL statements.

## Usage

Create data formats:

```typescript
import { createDataFormatDeclaration } from 'ts-entity-framework/dist/dataFormat'

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

Create entities, loading all data formats and the relations between them:

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

Create type definitions for entities:

```typescript
import { DataFormatDeclarationToRecord } from 'ts-entity-framework/dist/dataFormat/types'

export type UserRecord = DataFormatDeclarationToRecord<typeof USER_DFD>
// { id: number, name: string }

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
// Perform CRUD operations on entities, all fully type-enforced according to the data format
const user = await baseUserDbStore.add({ name: 'newUser' })
// Get related data, all also fully type-enforced, according to data formats and relations
const userGroups = await baseUserDbStore.getUserGroupsOfUser(user.id)
```