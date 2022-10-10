import { createSimplePgClient, createSimplePgClientFromClient } from 'simple-pg-client'
import { SimplePgClient, SimplePgClientFromClientOptions, SimplePgClientOptions } from 'simple-pg-client/dist/types'
import { toDictReadonly } from '../helpers/dict'
import { DataFormatList, DataFormats } from '../dataFormat/types'
import { createRelation } from '../relations'
import { TsPgOrm } from './types'
import { createProvisionStoresSql, createStores, createUnprovisionStoresSql, provisionStores, unprovisionStores } from '../stores'
import { RelationOptionsList, Relation, Relations, RelationType } from '../relations/types'
import { VersionTransforms, VersionTransformsOptions } from '../versioning/types'

const setVersionTransforms = (
  tsPgOrm: TsPgOrm<DataFormats, Relations, {}>,
  options: VersionTransformsOptions,
) => {
  delete tsPgOrm.setVersionTransforms

  const _tsPgOrm = tsPgOrm as unknown as TsPgOrm<DataFormats, Relations, VersionTransforms>

  _tsPgOrm.versionTransforms = {}

  return _tsPgOrm
}

const provideDbClient = (
  tsPgOrm: TsPgOrm,
  options: SimplePgClient,
  manyToManyRelationList: Relation<RelationType.MANY_TO_MANY>[],
) => {
  const _tsPgOrm = tsPgOrm as TsPgOrm<DataFormats, Relations, VersionTransforms, true>
  _tsPgOrm.db = options
  _tsPgOrm.provisionStores = _options => provisionStores(_tsPgOrm as any, _options)
  _tsPgOrm.unprovisionStores = _options => unprovisionStores(_tsPgOrm as any, _options)
  _tsPgOrm.stores = createStores(_tsPgOrm as any, manyToManyRelationList, options)

  return _tsPgOrm
}

const providePgClient = (
  tsPgOrm: TsPgOrm,
  options: SimplePgClientFromClientOptions,
  manyToManyRelationList: Relation<RelationType.MANY_TO_MANY>[],
) => {
  const db = createSimplePgClientFromClient(options)

  const _tsPgOrm = tsPgOrm as TsPgOrm<DataFormats, Relations, VersionTransforms, true>
  _tsPgOrm.db = db
  _tsPgOrm.provisionStores = _options => provisionStores(_tsPgOrm as any, _options)
  _tsPgOrm.unprovisionStores = _options => unprovisionStores(_tsPgOrm as any, _options)
  _tsPgOrm.stores = createStores(_tsPgOrm as any, manyToManyRelationList, db)

  return _tsPgOrm
}

const connect = async (
  tsPgOrm: TsPgOrm,
  options: SimplePgClientOptions,
  manyToManyRelationList: Relation<RelationType.MANY_TO_MANY>[],
) => {
  const db = await createSimplePgClient(options)

  const _tsPgOrm = tsPgOrm as TsPgOrm<DataFormats, Relations, VersionTransforms, true>
  _tsPgOrm.db = db
  _tsPgOrm.provisionStores = _options => provisionStores(_tsPgOrm as any, _options)
  _tsPgOrm.unprovisionStores = _options => unprovisionStores(_tsPgOrm as any, _options)
  _tsPgOrm.stores = createStores(_tsPgOrm as any, manyToManyRelationList, db)

  return _tsPgOrm
}

const setRelations = (
  tsPgOrm: TsPgOrm<DataFormats, {}, {}, false>,
  relationOptionsList: RelationOptionsList,
) => {
  const relations = {} as Relations
  const manyToManyRelationList: Relation<RelationType.MANY_TO_MANY>[] = []
  relationOptionsList.forEach(relationOptions => {
    const relation = createRelation(relationOptions as any, tsPgOrm.dataFormats)
    const _relations = relations as any
    _relations[relation.name] = relation
    if (relation.type === RelationType.MANY_TO_MANY)
      manyToManyRelationList.push(relation)
  })

  delete tsPgOrm.setRelations
  const _tsPgOrm = tsPgOrm as unknown as TsPgOrm<DataFormats, Relations, {}, false>

  _tsPgOrm.relations = relations
  _tsPgOrm.connect = _options => connect(_tsPgOrm as any, _options, manyToManyRelationList) as any
  _tsPgOrm.provideDbClient = _options => provideDbClient(_tsPgOrm as any, _options, manyToManyRelationList) as any
  _tsPgOrm.providePgClient = _options => providePgClient(_tsPgOrm as any, _options, manyToManyRelationList) as any
  _tsPgOrm.createProvisionStoresSql = _options => createProvisionStoresSql(_tsPgOrm as any, _options)
  _tsPgOrm.createUnprovisionStoresSql = _options => createUnprovisionStoresSql(_tsPgOrm as any, _options)
  _tsPgOrm.setVersionTransforms = _options => setVersionTransforms(_tsPgOrm as any, _options) as any

  return _tsPgOrm
}

export const createTsPgOrm = <TDataFormatList extends DataFormatList>(
  dataFormatList: TDataFormatList,
  version: number = 1,
// eslint-disable-next-line arrow-body-style
): TsPgOrm<DataFormats<TDataFormatList>, {}, {}, false> => {
  let tsPgOrm: TsPgOrm<DataFormats, {}, {}, false>

  return tsPgOrm = {
    dataFormatOrder: dataFormatList.map(df => df.name) as any[],
    dataFormats: toDictReadonly(dataFormatList, item => ({ key: item.name, value: item })) as any,
    // @ts-ignore TODO: not sure what is going on here
    setRelations: options => setRelations(tsPgOrm as any, options as any) as any,
  }
}
