import { createSimplePgClient } from 'simple-pg-client'
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
  createStoresOptions: CreateStoresOptions,
  tsPgOrm: TsPgOrm,
) => {
  const db = createStoresOptions.db ?? tsPgOrm.db
  if (db == null)
    throw new Error('No database service provided.')
  const provisionOrder = createStoresOptions.provisionOrder
  const unprovisionStores = createStoresOptions.unprovisionStores

  // Create stores
  const storesDict = toDict(provisionOrder as string[], entityName => ({
    key: entityName,
    value: createStore(createStoresOptions.db ?? tsPgOrm.db, tsPgOrm, entityName),
  })) as any

  const reverseProvisionOrder = provisionOrder.slice(0).reverse()

  const unprovisionOrder = unprovisionStores == null || unprovisionStores === false
    ? []
    : unprovisionStores === true
      ? reverseProvisionOrder
      : unprovisionStores

  // Unprovision stores
  await Promise.all(unprovisionOrder.map(entityName => storesDict[entityName].unprovision()))

  // Provision stores
  await Promise.all(provisionOrder.map(entityName => storesDict[entityName].provision()))

  return storesDict
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
    initDbService: async options => {
      const db = await createSimplePgClient(options)
      tsPgOrm.db = db
      return db
    },
    setDbService: newDbService => tsPgOrm.db = newDbService,
    dataFormats: dataFormatsDict,
    relations: relationsDict,
    dataFormatDeclarations,
    relationDeclarations,
    sql: {
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
      createStores: async _options => createStores(_options as any, tsPgOrm as any),
    },
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
