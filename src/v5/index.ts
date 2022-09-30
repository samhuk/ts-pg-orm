import { toDictReadonly } from '../helpers/dict'
import { DataFormatList } from './dataFormat/types'
import { createRelation } from './relations'
import { TsPgOrmWithNoRelations } from './types'

export const createTsPgOrm = <TDataFormatList extends DataFormatList>(
  dataFormatList: TDataFormatList,
// eslint-disable-next-line arrow-body-style
): TsPgOrmWithNoRelations<TDataFormatList> => {
  const dataFormats = toDictReadonly(dataFormatList, item => ({ key: item.name, value: item }))
  return {
    dataFormats: dataFormats as any,
    setRelations: relationOptionsList => {
      const relations = {} as any
      relationOptionsList.forEach(relationOptions => {
        const relation = createRelation(relationOptions as any, dataFormats)
        relations[relation.name] = relation
      })
      return {
        db: undefined,
        initDbClient: undefined,
        setDbClient: undefined,
        setDbClientByClient: undefined,
        dataFormats,
        relations,
        stores: undefined,
        provisionStores: undefined,
        unprovisionStores: undefined,
      } as any
    },
  }
}
