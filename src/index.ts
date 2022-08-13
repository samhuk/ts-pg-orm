import { createSimplePgClient, createSimplePgClientFromClient } from 'simple-pg-client'
import { createDataFormat } from './dataFormat'
import {
  DataFormatDeclarations,
  DataFormatsDict,
} from './dataFormat/types'
import { toDict } from './helpers/dict'
import { createRelationName, createRelation } from './relations'
import { Relation, RelationDeclarations, RelationsDict, RelationType } from './relations/types'
import { createStore } from './store'
import { TsPgOrm, UnloadedTsPgOrm, TsPgOrmWithDataFormats, CreateStoresOptions } from './types'

const createStores = async (
  tsPgOrm: TsPgOrm,
  options?: CreateStoresOptions,
) => {
  const db = options?.db ?? tsPgOrm.db
  if (db == null)
    throw new Error('No database client is available to use.')

  const provisionStores = options?.provisionStores as (boolean | string[])
  const provisionOrder = provisionStores == null || provisionStores === true
    ? tsPgOrm.dataFormatDeclarations.map(dfd => dfd.name)
    : provisionStores === false
      ? []
      : provisionStores

  const unprovisionStores = options?.unprovisionStores as (boolean | string[])
  const unprovisionOrder = unprovisionStores == null || unprovisionStores === false
    ? []
    : unprovisionStores === true
      ? provisionOrder.slice(0).reverse() // Shallow copy and then reverse the provision order
      : unprovisionStores

  // Create stores
  const storesDict = toDict(provisionOrder as string[], entityName => ({
    key: entityName,
    value: createStore(db, tsPgOrm, entityName),
  }))

  // Unprovision join tables
  if (options?.unprovisionJoinTables ?? false)
    await tsPgOrm.dropJoinTables(db)

  // Unprovision stores
  await Promise.all(unprovisionOrder.map(entityName => storesDict[entityName].unprovision()))

  // Provision stores
  await Promise.all(provisionOrder.map(entityName => storesDict[entityName].provision()))

  // Provision join tables
  if (options?.provisionJoinTables ?? true)
    await tsPgOrm.createJoinTables(db)

  return storesDict as any
}

const _createTsPgOrm = <
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>
>(
    dataFormatsDict: DataFormatsDict<T>,
    relationsDict: RelationsDict<T, K>,
    dataFormatDeclarations: T,
    relationDeclarations: K,
  ): TsPgOrm<T, K> => {
  let tsPgOrm: TsPgOrm<T, K>
  const manyToManyRelationsList = Object.values(relationsDict)
    .filter(r => (r as Relation<T>).type === RelationType.MANY_TO_MANY) as Relation<T, RelationType.MANY_TO_MANY>[]

  return tsPgOrm = {
    db: null,
    initDbClient: async options => {
      const db = await createSimplePgClient(options)
      tsPgOrm.db = db
      return db
    },
    setDbClient: newDbClient => tsPgOrm.db = newDbClient,
    setDbClientByClient: options => {
      const newDbClient = createSimplePgClientFromClient(options)
      tsPgOrm.setDbClient(newDbClient)
    },
    dataFormats: dataFormatsDict,
    relations: relationsDict,
    dataFormatDeclarations,
    relationDeclarations,
    dropJoinTable: (relationName, db) => (db ?? tsPgOrm.db).query(
      ((relationsDict as any)[relationName] as Relation<T, RelationType.MANY_TO_MANY>).sql.dropJoinTableSql,
    ).then(() => true),
    createJoinTable: (relationName, db) => (db ?? tsPgOrm.db).query(
      ((relationsDict as any)[relationName] as Relation<T, RelationType.MANY_TO_MANY>).sql.createJoinTableSql,
    ).then(() => true),
    dropJoinTables: db => {
      const _db = db ?? tsPgOrm.db
      return Promise.all(
        manyToManyRelationsList
          .map(r => r.sql.dropJoinTableSql)
          .map(sql => _db.query(sql)),
      ).then(() => true)
    },
    createJoinTables: db => {
      const _db = db ?? tsPgOrm.db
      return Promise.all(
        manyToManyRelationsList
          .map(r => r.sql.createJoinTableSql)
          .map(sql => _db.query(sql)),
      ).then(() => true)
    },
    createStores: async _options => createStores(tsPgOrm as any, _options as any),
  }
}

/**
 * Creates an `UnloadedTsPgOrm` instance that accepts the loading of
 * Data Format Declarations.
 */
export const createTsPgOrm = (): UnloadedTsPgOrm => ({
  loadDataFormats: <T extends DataFormatDeclarations>(dataFormatDeclarations: T): TsPgOrmWithDataFormats<T> => {
    const dataFormatsDict = {} as DataFormatsDict<T>
    dataFormatDeclarations.forEach(d => (dataFormatsDict as any)[d.name] = createDataFormat(d))

    return {
      dataFormats: dataFormatsDict,
      loadRelations: <K extends RelationDeclarations<T>>(
        relationDeclarationsCreator: (dataFormats: DataFormatsDict<T>) => K,
      ): TsPgOrm<T, K> => {
        const relationsDict = {} as RelationsDict<T, K>
        const relationDeclarations = relationDeclarationsCreator(dataFormatsDict)
        relationDeclarations.forEach(d => (relationsDict as any)[createRelationName(d)] = createRelation(d))

        return _createTsPgOrm(dataFormatsDict, relationsDict, dataFormatDeclarations, relationDeclarations)
      },
    }
  },
})
