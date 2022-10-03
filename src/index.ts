import { createSimplePgClient, createSimplePgClientFromClient } from 'simple-pg-client'
import { toDictReadonly } from './helpers/dict'
import { DataFormatList, DataFormats } from './dataFormat/types'
import { createRelation } from './relations'
import { TsPgOrm, TsPgOrmWithNoRelations } from './types'
import { createProvisionStoresSql, createStores, createUnprovisionStoresSql, provisionStores, unprovisionStores } from './stores'
import { RelationOptionsList, Relation, Relations, RelationType } from './relations/types'

export const createTsPgOrm = <TDataFormatList extends DataFormatList>(
  dataFormatList: TDataFormatList,
// eslint-disable-next-line arrow-body-style
): TsPgOrmWithNoRelations<TDataFormatList> => {
  const dataFormats = toDictReadonly(dataFormatList, item => ({ key: item.name, value: item }))
  return {
    dataFormats: dataFormats as any,
    setRelations: <TRelationOptionsList extends RelationOptionsList<DataFormats<TDataFormatList>>>(relationOptionsList: TRelationOptionsList) => {
      const relations = {} as Relations<DataFormats<TDataFormatList>, TRelationOptionsList>
      const manyToManyRelationList: Relation<RelationType.MANY_TO_MANY>[] = []
      relationOptionsList.forEach(relationOptions => {
        const relation = createRelation(relationOptions as any, dataFormats)
        const _relations = relations as any
        _relations[relation.name] = relation
        if (relation.type === RelationType.MANY_TO_MANY)
          manyToManyRelationList.push(relation)
      })

      const tsPgOrm: TsPgOrm<DataFormats<TDataFormatList>, Relations<DataFormats<TDataFormatList>, TRelationOptionsList>> = {
        db: null,
        initDbClient: async options => {
          const db = await createSimplePgClient(options)
          tsPgOrm.db = db
          tsPgOrm.stores = createStores(tsPgOrm as any, manyToManyRelationList, db) as any
          return db
        },
        setDbClient: db => {
          tsPgOrm.db = db
          tsPgOrm.stores = createStores(tsPgOrm as any, manyToManyRelationList, db) as any
        },
        setDbClientByClient: options => {
          const db = createSimplePgClientFromClient(options)
          tsPgOrm.setDbClient(db)
          tsPgOrm.stores = createStores(tsPgOrm as any, manyToManyRelationList, db) as any
        },
        dataFormats: dataFormats as any,
        dataFormatOrder: dataFormatList.map(df => df.name) as any[],
        relations,
        stores: null,
        provisionStores: options => provisionStores(tsPgOrm as any, options),
        createProvisionStoresSql: options => createProvisionStoresSql(tsPgOrm as any, options),
        unprovisionStores: options => unprovisionStores(tsPgOrm as any, options),
        createUnprovisionStoresSql: options => createUnprovisionStoresSql(tsPgOrm as any, options),
      }
      return tsPgOrm
    },
  }
}
