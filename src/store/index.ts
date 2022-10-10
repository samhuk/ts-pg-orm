import { SimplePgClient } from 'simple-pg-client/dist/types'
import { DataFormats } from '../dataFormat/types'
import { Relations } from '../relations/types'
import { TsPgOrm } from '../tsPgOrm/types'
import { count } from './count'
import { create, createManual } from './create'
import { _delete } from './delete'
import { exists } from './exists'
import { getSingle, getMultiple } from './get'
import { Store } from './types'
import { update } from './update'

export const createStore = <
  TDataFormats extends DataFormats,
  TRelations extends Relations,
  TLocalDataFormatName extends string,
>(
    db: SimplePgClient,
    tsPgOrm: TsPgOrm,
    localDataFormatName: TLocalDataFormatName,
  ): Store<TDataFormats, TRelations, TLocalDataFormatName> => {
  const localDataFormat = tsPgOrm.dataFormats[localDataFormatName]
  // const foreignKeyRelevantRelations = getRelevantRelationsForForeignKeys(tsPgOrm.relations, localDataFormatName)
  // const createTableSql = localDataFormat.sql.createCreateTableSql(foreignKeyRelevantRelations)

  return {
    create: options => create(db, localDataFormat, options) as any,
    createManual: options => createManual(db, localDataFormat, options) as any,
    update: options => update(db, localDataFormat, options) as any,
    delete: options => _delete(db, localDataFormat, options) as any,
    count: options => count(db, localDataFormat, options),
    exists: options => exists(db, localDataFormat, options),
    get: options => getSingle(tsPgOrm as any, db, localDataFormat, options as any) as any,
    getMany: options => getMultiple(tsPgOrm as any, db, localDataFormat, options as any) as any,
  }
}
