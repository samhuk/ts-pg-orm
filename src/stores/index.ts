import { SimplePgClient } from 'simple-pg-client/dist/types'
import { removeDuplicates } from '../helpers/array'
import { toDict } from '../helpers/dict'
import { NonManyToManyRelationList, Relation, Relations, RelationType } from '../relations/types'
import { createStore } from '../store'
import { createJoinTableStoresDict } from '../store/joinTable'
import { ConnectedTsPgOrm, TsPgOrm } from '../types'
import { ProvisionStoresOptions, UnprovisionStoresOptions } from './types'

const determineJoinTableStoreNameList = (relations: Relations): string[] => Object.values(relations)
  .filter(r => r.type === RelationType.MANY_TO_MANY)
  .map(r => r.name)

const determineRelevantNonManyToManyRelationList = (
  relations: Relations,
  localDataFormatName: string,
) => Object.values(relations).filter(r => (
  (r.type === RelationType.ONE_TO_MANY && r.toManyField.dataFormat === localDataFormatName)
    || (r.type === RelationType.ONE_TO_ONE && r.toOneField.dataFormat === localDataFormatName)),
// eslint-disable-next-line function-paren-newline
) as NonManyToManyRelationList

export const createStores = (
  tsPgOrm: TsPgOrm,
  manyToManyRelationList: Relation<RelationType.MANY_TO_MANY>[],
  db: SimplePgClient,
) => {
  const storesDict = toDict(tsPgOrm.dataFormatOrder, dataFormatName => ({
    key: dataFormatName,
    value: createStore(db, tsPgOrm, dataFormatName),
  }))

  const joinTableStoresDict = createJoinTableStoresDict(tsPgOrm.dataFormats, manyToManyRelationList, db)

  return { ...storesDict, ...joinTableStoresDict }
}

export const createProvisionStoresSql = (
  tsPgOrm: TsPgOrm,
  options?: ProvisionStoresOptions,
) => {
  const provisionOrder = options?.provisionStores
    ?? tsPgOrm.dataFormatOrder.concat(determineJoinTableStoreNameList(tsPgOrm.relations))

  const dataFormatToRelevantNonManyToManyRelationList = toDict(
    provisionOrder.filter(storeName => tsPgOrm.dataFormats[storeName] != null),
    storeName => ({ key: storeName, value: determineRelevantNonManyToManyRelationList(tsPgOrm.relations, storeName) }),
  )

  const createTablesSql = provisionOrder
    .map(storeName => (
      tsPgOrm.dataFormats[storeName]?.sql.createTableSql(dataFormatToRelevantNonManyToManyRelationList[storeName])
        ?? ((tsPgOrm.relations as any)[storeName] as Relation<RelationType.MANY_TO_MANY>).sql.createJoinTableSql
    ))
    .join('\n\n')

  const foreignKeysSql = provisionOrder
    .filter(storeName => tsPgOrm.dataFormats[storeName] != null)
    .map(storeName => (
      dataFormatToRelevantNonManyToManyRelationList[storeName]
        .map(r => r.sql.foreignKeySql)
        .join('\n')
    )).join('\n')

  return ['START TRANSACTION;', createTablesSql, foreignKeysSql, 'COMMIT;'].join('\n')
}

export const provisionStores = async (
  tsPgOrm: ConnectedTsPgOrm,
  options?: ProvisionStoresOptions,
) => {
  const db = options?.db ?? tsPgOrm.db
  if (db == null)
    throw new Error('No database client is available to use.')

  const sql = createProvisionStoresSql(tsPgOrm, options)

  await db.query(sql)
}

export const createUnprovisionStoresSql = (
  tsPgOrm: TsPgOrm,
  options?: UnprovisionStoresOptions,
) => {
  const unprovisionOrder = options?.unprovisionStores
    ?? determineJoinTableStoreNameList(tsPgOrm.relations).concat(tsPgOrm.dataFormatOrder.slice(0).reverse())

  const nonManyToManyRelationList = Object.values(tsPgOrm.relations)
    .filter(r => r.type !== RelationType.MANY_TO_MANY) as NonManyToManyRelationList
  const dataFormatNamesBeingUnprovisioned = unprovisionOrder
    .filter(storeName => tsPgOrm.dataFormats[storeName] != null)

  // Drop all of the constraints that depend on the tables that are going to be dropped
  const dropForeignKeyConstraintsSql = dataFormatNamesBeingUnprovisioned
    .map(dataFormatName => (
      nonManyToManyRelationList
        .filter(r => (
          (r.type === RelationType.ONE_TO_ONE && r.toOneField.dataFormat === dataFormatName)
          || (r.type === RelationType.ONE_TO_MANY && r.toManyField.dataFormat === dataFormatName)
        ))
        .map(r => ({ tableNameOfConstraint: tsPgOrm.dataFormats[dataFormatName].sql.tableName, constraintName: r.sql.foreignKeyName }))
    ))
    .flat()
    .map(info => `alter table ${info.tableNameOfConstraint} if exists drop constraint if exists "${info.constraintName}";`)
    .join('\n')

  const dropTablesSql = unprovisionOrder
    .map(storeName => (
      tsPgOrm.dataFormats[storeName]?.sql.dropTableSql
        ?? ((tsPgOrm.relations as any)[storeName] as Relation<RelationType.MANY_TO_MANY>).sql.dropJoinTableSql
    ))
    .join('\n')

  return ['START TRANSACTION;', dropForeignKeyConstraintsSql, dropTablesSql, 'COMMIT;'].join('\n')
}

export const unprovisionStores = async (
  tsPgOrm: ConnectedTsPgOrm,
  options?: UnprovisionStoresOptions,
) => {
  const db = options?.db ?? tsPgOrm.db
  if (db == null)
    throw new Error('No database client is available to use.')

  const sql = createUnprovisionStoresSql(tsPgOrm, options)

  await db.query(sql)
}
