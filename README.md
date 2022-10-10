<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./images/wordmark-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="./images/wordmark-light.png">
    <img alt="ts-pg-orm" src="./images/wordmark-light.svg">
  </picture>
</p>

<p align="center">
  <em>Delightful Typescript PostgreSQL ORM</em>
</p>

<p align="center">
  <a href="https://github.com/samhuk/ts-pg-orm/actions/workflows/ci.yaml/badge.svg" target="_blank">
    <img src="https://github.com/samhuk/ts-pg-orm/actions/workflows/ci.yaml/badge.svg" alt="ci status" />
  </a>
  <a href="https://codecov.io/gh/samhuk/ts-pg-orm" > 
    <img src="https://codecov.io/gh/samhuk/ts-pg-orm/branch/master/graph/badge.svg?token=N0WKDLEDNM"/> 
  </a>
  <a href="https://img.shields.io/badge/License-MIT-green.svg" target="_blank">
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="license" />
  </a>
  <a href="https://app.fossa.com/projects/custom%2B33608%2Fgithub.com%2Fsamhuk%2Fts-pg-orm?ref=badge_shield" alt="FOSSA Status">
    <img src="https://app.fossa.com/api/projects/custom%2B33608%2Fgithub.com%2Fsamhuk%2Fts-pg-orm.svg?type=shield"/>
  </a>
  <a href="https://badge.fury.io/js/ts-pg-orm.svg" target="_blank">
    <img src="https://badge.fury.io/js/ts-pg-orm.svg" alt="npm version" />
  </a>
</p>

## Introduction

ts-pg-orm provides powerful PostgreSQL persistence for your Typescript application with less guess-work.

Start by viewing the [Getting Started](https://github.com/samhuk/ts-pg-orm/wiki/Getting-Started) guide.

## Usage Overview

Define data formats, relations, and database connectivity to create type-safe auto-completing data stores:

```typescript
import { createDataFormat, createTsPgOrm, ... } from 'ts-pg-orm'
const userDF = createDataFormat(...)
const ORM = createTsPgOrm([userDF, ...] as const).setRelations([...] as const)
const orm = await ORM.initDbClient({ host: 'localhost', port: 5432, ... })
await orm.provisionStores()
```

Perform CRUD operations on data stores:

```typescript
// Create
const userCreated = await orm.stores.user.create({ name: 'alice' })
// Get
const userFound = await orm.stores.user.get({
  fields: ['name'],
  filter: { field: 'id', op: Operator.EQUALS, val: 1 },
  relations: { // Recursively include related data
    userGroups: {
      query: { ... },
      relations: { ... }
    },
  },
})
// Update
const userUpdated = await orm.stores.user.update({
  query: {
    filter: { ... },
  },
  record: { name: 'bob' },
  return: true,
})
// Delete
const userDeleted = await orm.stores.user.delete({
  query: {
    filter: { ... },
  },
  return: true,
})
```

Create types to use throughout your application:

```typescript
export type UserRecord = ToRecord<typeof USER_DFD>
// { id: number, name: string, ... }
export type CreateUserRecordOptions = CreateRecordOptions<typeof USER_DFD>
// { name: string, ... }
export type UserGroupRecord = ToRecord<typeof USER_GROUP_DFD>
// { id: number, name: string, ... }
```

Use type-enforced sql information to create bespoke SQL statements:

```typescript
const userSql = ORM.dataFormats.user.sql
const customUserSql = `select ${userSql.columnNames.name} from ${userSql.tableName}`
```

## Examples

### Integration Tests

The integration test suite connects to a real PostgreSQL server at (by default) postgres@localhost:5432 and performs various ts-pg-orm queries with a set of example data formats and relations.

Run `npm run integration-tests` to build and run these. The database connection configuration is at `/.env-cmdrc.json`.

---

If you found this package delightful, feel free to buy me a coffee ✨

<a href="https://www.buymeacoffee.com/samhuk" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>
