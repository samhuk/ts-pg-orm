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
import { createJoinTableStoresDict } from './store/joinTable'
import { TsPgOrm, UnloadedTsPgOrm, TsPgOrmWithDataFormats, CreateStoresOptions } from './types'

const createStores = async (
  tsPgOrm: TsPgOrm,
  manyToManyRelationsList: Relation<DataFormatDeclarations, RelationType.MANY_TO_MANY>[],
  options?: CreateStoresOptions,
) => {
  const db = options?.db ?? tsPgOrm.db
  if (db == null)
    throw new Error('No database client is available to use.')

  const dataFormatNames = tsPgOrm.dataFormatDeclarations.map(dfd => dfd.name)

  // Create stores
  const storesDict = toDict(dataFormatNames, entityName => ({
    key: entityName,
    value: createStore(db, tsPgOrm, entityName),
  }))

  const joinTableStoresDict = createJoinTableStoresDict(tsPgOrm.dataFormats, manyToManyRelationsList, db)
  const joinTableStoreNames = Object.keys(joinTableStoresDict)

  const storesAndJoinTableStoresDict = { ...storesDict, ...joinTableStoresDict }

  const provisionStores = options?.provisionStores as (boolean | string[])
  const provisionOrder = provisionStores == null || provisionStores === true
    ? dataFormatNames.concat(joinTableStoreNames)
    : provisionStores === false
      ? []
      : provisionStores

  const unprovisionStores = options?.unprovisionStores as (boolean | string[])
  const unprovisionOrder = unprovisionStores == null || unprovisionStores === false
    ? []
    : unprovisionStores === true
      ? provisionOrder.slice(0).reverse()
      : unprovisionStores

  // Unprovision stores
  await Promise.all(unprovisionOrder.map(storeName => (storesAndJoinTableStoresDict as any)[storeName].unprovision()))

  // Provision stores
  await Promise.all(provisionOrder.map(storeName => (storesAndJoinTableStoresDict as any)[storeName].provision()))

  return storesAndJoinTableStoresDict as any
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
    createStores: async _options => createStores(tsPgOrm as any, manyToManyRelationsList as any, _options as any),
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
        relationDeclarations.forEach(d => {
          const relationName = createRelationName(d)
          const _relationsDict = relationsDict as any
          _relationsDict[relationName] = createRelation(d, relationName)
        })

        return _createTsPgOrm(dataFormatsDict, relationsDict, dataFormatDeclarations, relationDeclarations)
      },
    }
  },
})
