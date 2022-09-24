<h1 align="center">ts-pg-orm</h1>
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

Define your data formats, relations, and database connectivity to create type-safe auto-completing data stores.

```typescript
// -- Set up TsPgOrm instance and data stores
const ORM = createTsPgOrm()
  .loadDataFormats([...] as const)
  .loadRelations(dfs => [...] as const)
await ORM.initDbClient({ host: 'localhost', port: 5432, ... })
const stores = await ORM.createStores()
```

Perform CRUD operations on data stores

```typescript
// Create
const userCreated = await stores.user.create({ name: 'alice' })
// Get
const userFound = await stores.user.get({
  fields: ['name'],
  filter: { field: 'id', op: Operator.EQUALS, val: 1 },
  relations: { // Recursively include related data
    userGroups: {
      query: { ... },
    },
  },
})
// Update
const userUpdated = await stores.user.update({
  query: {
    filter: { ... },
  },
  record: { name: 'bob' },
  return: true,
})
// Delete
const userDeleted = await stores.user.delete({
  query: {
    filter: { ... },
  },
  return: true,
})
```

Create types to use throughout your application

```typescript
export type UserRecord = ToRecord<typeof USER_DFD>
// { id: number, name: string, ... }
export type CreateUserRecordOptions = CreateRecordOptions<typeof USER_DFD>
// { name: string, ... }
export type UserGroupRecord = ToRecord<typeof USER_GROUP_DFD>
// { id: number, name: string, ... }
```

Use type-enforced sql information to create bespoke SQL statements

```typescript
const sql = ORM.dataFormats.user.sql
const customUserSql = `select ${sql.columnNames.name} from ${sql.tableName}`
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
