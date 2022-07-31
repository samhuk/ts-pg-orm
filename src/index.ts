import { createDataFormat } from './dataFormat'
import {
  DataFormatDeclarations,
  DataFormatsDict,
} from './dataFormat/types'
import { toDict } from './helpers/dict'
import { createRelationName, createRelation } from './relations'
import { Relation, RelationDeclarations, RelationsDict, RelationType } from './relations/types'
import { createDbStore } from './store'
import { Entities, UnloadedEntities, EntitiesWithDataFormats, CreateEntitiesOptions, StoresDict } from './types'

const _createEntities = <
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>
>(
    dataFormatsDict: DataFormatsDict<T>,
    relationsDict: RelationsDict<T, K>,
    dataFormatDeclarations: T,
    relationDeclarations: K,
  ): Entities<T, K> => {
  let entities: Entities<T, K>
  const manyToManyRelationsList = Object.values(relationsDict)
    .filter(r => (r as Relation<T>).type === RelationType.MANY_TO_MANY) as Relation<T, RelationType.MANY_TO_MANY>[]

  return entities = {
    dataFormats: dataFormatsDict,
    relations: relationsDict,
    dataFormatDeclarations,
    relationDeclarations,
    sql: {
      dropJoinTable: (relationName, db) => db.query(
        // @ts-ignore
        (relationsDict[relationName] as Relation<T, RelationType.MANY_TO_MANY>).dropJoinTableSql,
      ).then(() => true),
      createJoinTable: (relationName, db) => db.query(
        // @ts-ignore
        (relationsDict[relationName] as Relation<T, RelationType.MANY_TO_MANY>).createJoinTableSql,
      ).then(() => true),
      dropJoinTables: db => Promise.all(
        manyToManyRelationsList
          .map(r => r.sql.dropJoinTableSql)
          .map(sql => db.query(sql)),
      ).then(() => true),
      createJoinTables: db => Promise.all(
        manyToManyRelationsList
          .map(r => r.sql.createJoinTableSql)
          .map(sql => db.query(sql)),
      ).then(() => true),
      // @ts-ignore
      createStore: (entityName, db) => createDbStore(db, entities, entityName),
      createAndProvisionStores: async (db, provisionOrder, unprovisionStores) => {
        // Create stores
        const storesDict = toDict(provisionOrder as string[], entityName => ({
          key: entityName,
          value: createDbStore(db, entities, entityName),
        })) as unknown as StoresDict<T, K>

        const reverseProvisionOrder = provisionOrder.slice(0).reverse()

        const unprovisionOrder = unprovisionStores == null || unprovisionStores === false
          ? []
          : unprovisionStores === true
            ? reverseProvisionOrder
            : reverseProvisionOrder.filter(entityName => unprovisionStores.indexOf(entityName) !== -1)

        // Unprovision stores
        await Promise.all(unprovisionOrder.map(entityName => storesDict[entityName].provision()))

        // Provision stores
        await Promise.all(provisionOrder.map(entityName => storesDict[entityName].provision()))

        return storesDict
      },
    },
  }
}

/**
 * Creates an `UnloadedEntities` instance that accepts the loading of
 * Data Format Declarations.
 */
export const createEntities = (
  options?: CreateEntitiesOptions,
): UnloadedEntities => ({
  loadDataFormats: <T extends DataFormatDeclarations>(dataFormatDeclarations: T): EntitiesWithDataFormats<T> => {
    const dataFormatsDict = {} as DataFormatsDict<T>
    dataFormatDeclarations.forEach(d => (dataFormatsDict as any)[d.name] = createDataFormat(d, options))

    return {
      dataFormats: dataFormatsDict,
      loadRelations: <K extends RelationDeclarations<T>>(
        relationDeclarationsCreator: (dataFormats: DataFormatsDict<T>) => K,
      ): Entities<T, K> => {
        const relationsDict = {} as RelationsDict<T, K>
        const relationDeclarations = relationDeclarationsCreator(dataFormatsDict)
        relationDeclarations.forEach(d => (relationsDict as any)[createRelationName(d)] = createRelation(d))

        return _createEntities(dataFormatsDict, relationsDict, dataFormatDeclarations, relationDeclarations)
      },
    }
  },
})
