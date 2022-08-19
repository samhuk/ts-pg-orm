import { createSimplePgClient, createSimplePgClientFromClient } from 'simple-pg-client'
import { DataFormatList, DataFormats } from '../dataFormatNew/types'
import { createRelation } from '../relationNew'
import { RelationList, Relations } from '../relationNew/types'
import { tsPgOrm } from '../testData'
import { EmptyOrm, Orm } from './types'

const _createOrm = (
  dataFormatList: DataFormatList,
  dataFormats: DataFormats,
  relationList: RelationList,
  relations: Relations,
): Orm => {
  let orm: Orm
  return orm = {
    dataFormatList,
    dataFormats,
    relationList,
    relations,
    db: null,
    initDbClient: async options => {
      const db = await createSimplePgClient(options)
      orm.db = db
      return db
    },
    setDbClient: newDbClient => tsPgOrm.db = newDbClient,
    setDbClientByClient: options => {
      const newDbClient = createSimplePgClientFromClient(options)
      orm.setDbClient(newDbClient)
    },
    createStores: () => undefined,
  }
}

export const createOrm = (): EmptyOrm => ({
  defineDataFormats: dataFormatList => {
    const dataFormats: any = {}
    dataFormatList.forEach(df => dataFormats[df.name] = df)

    return {
      dataFormatList,
      dataFormats,
      defineRelations: relationOptionsListCreator => {
        const relationOptionsList = typeof relationOptionsListCreator === 'function'
          ? relationOptionsListCreator(dataFormats)
          : relationOptionsListCreator
        const relationList = relationOptionsList.map(relationOptions => createRelation(relationOptions as any))
        const relations: any = {}
        relationOptionsList.forEach(relation => relations[relation.name] = relation)

        return _createOrm(dataFormatList, dataFormats, relationList as any, relations) as any
      },
    }
  },
})
