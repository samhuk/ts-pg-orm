# ts-pg-orm

![build](https://github.com/samhuk/ts-pg-orm/actions/workflows/build.yaml/badge.svg)
![MIT License](https://img.shields.io/badge/License-MIT-green.svg)
[![npm version](https://badge.fury.io/js/ts-pg-orm.svg)](https://badge.fury.io/js/ts-pg-orm)

Delightful Typescript PostgreSQL ORM.

A package for creating data formats, relations, and postgresql data stores with full Typescript enforcement.

Visit the [Getting Started](https://github.com/samhuk/ts-pg-orm/wiki/Getting-Started) for an in-depth usage guide.

## Usage Highlight

```typescript
import { createTsPgOrm } from 'ts-pg-orm'
import { RelationType } from 'ts-pg-orm/dist/relations/types'
import { createDataFormatDeclaration } from 'ts-pg-orm/dist/dataFormat'
import { DataType, NumberDataSubType, StringDataSubType } from 'ts-pg-orm/dist/dataFormat/types'
import { ToRecord, CreateRecordOptions } from 'ts-pg-orm/dist/dataFormat/types'

const USER_DFD = createDataFormatDeclaration({ name: 'user', fields: [...] } as const)

const USER_GROUP_DFD = createDataFormatDeclaration({ name: 'userGroup', fields: [...] } as const)

// Create ORM
const ORM = createTsPgOrm()
  .loadDataFormats([USER_DFD,USER_GROUP_DFD] as const)
  .loadRelations(dfs => [
    { // user <<->> user group
      type: RelationType.MANY_TO_MANY,
      fieldRef1: dfs.user.fieldRefs.id,
      fieldRef2: dfs.userGroup.fieldRefs.id
    },
  ] as const)
// Connect DB
await ORM.initDbClient({ host: 'localhost', port: 5432, ... })
// Create stores
const stores = await ORM.createStores()
// Create records
const newUser = await stores.user.create({ name: 'newUser' })
// Retreive records
const userFound = await stores.user.getSingle({ ... })
// Update records
await stores.user.updateSingle({
  filter: { ... },
  record: { name: 'newNewUser' }
})
// Delete records
await stores.user.deleteSingle({
  filter: { ... },
})
// Create types
export type UserRecord = ToRecord<typeof USER_DFD>
// E.g. { id: number, name: string }
export type CreateUserRecordOptions = CreateRecordOptions<typeof USER_DFD>
// E.g. { name: string }
export type UserGroupRecord = ToRecord<typeof USER_GROUP_DFD>
// E.g. { id: number, name: string }
```

## Examples

Examples can be found within ./src/examples, showing more complete and realistic usages.

### Article API

This is a simple single-endpoint api that has two data formats - "User" and "UserArticle", with a single relation linking them.

Run `npm run article-api` to build and start the server (don't forget to run `npm i` first if you have not already). Once running, try sending a HTTP GET request to http://localhost:3000/userProfile/1.

### Real DB Test

This connects to a real PostgreSQL server at (by default) postgres@localhost:5432 and sets up a new ts-pg-orm instance with some sample data formats and relations, making queries to retreive records with related data.

Run `npm run real-db-test` to build and run this.

---

If you found this package delightful, feel free to buy me a coffee ✨

<a href="https://www.buymeacoffee.com/samhuk" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>
