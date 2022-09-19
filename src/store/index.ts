import { SimplePgClient } from 'simple-pg-client/dist/types'
import {
  DataFormat,
  DataFormatDeclarations,
} from '../dataFormat/types'
import { Relation, RelationDeclarations, RelationsDict, RelationType } from '../relations/types'
import { TsPgOrm } from '../types'
import { Store } from './types'
import { create, createManual } from './create'
import { _delete } from './delete'
import { update } from './update'
import { getSingle, getMultiple } from './get'
import { AnyGetFunctionOptions } from './get/types'
import { count } from './count'
import { exists } from './exists'

/**
 * Finds all of the relations where this data format requires a foreign key. This will be the
 * case if this data format is being referenced as the "to many" of any "one to many" relations
 * or as the "to one" of any "one to one" relations.
 *
 * If this data format is the former ("to many" of any "one to many" relations), then it will
 * require a foreign key constraint in the create sql.
 *
 * If this data format is the latter ("to one" of any "one to one" relations), then it will
 * require a foreign key constraint *and* a UNIQUE constraint (for the linked column) in the
 * create sql.
 */
const getRelevantRelationsForForeignKeys = <
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name']
>(
    relationsDict: RelationsDict<T, K>,
    localDataFormatName: L,
  ) => Object.values(relationsDict)
    .filter(r => {
      const _r = r as Relation<T>
      return (_r.type === RelationType.ONE_TO_MANY && _r.toManyField.formatName === localDataFormatName)
        || (_r.type === RelationType.ONE_TO_ONE && _r.toOneField.formatName === localDataFormatName)
    }) as Relation<T, RelationType.ONE_TO_MANY | RelationType.ONE_TO_ONE>[]

export const createStore = <
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
>(
    db: SimplePgClient,
    tsPgOrm: TsPgOrm<T, K>,
    localDataFormatName: L,
  ): Store<T, K, L> => {
  const localDataFormat = (tsPgOrm.dataFormats as any)[localDataFormatName] as DataFormat
  const foreignKeyRelevantRelations = getRelevantRelationsForForeignKeys(tsPgOrm.relations, localDataFormatName)
  const createTableSql = localDataFormat.sql.createCreateTableSql(foreignKeyRelevantRelations)

  return {
    provision: () => db.query(createTableSql) as Promise<any>,
    unprovision: () => db.query(`drop table if exists ${localDataFormat.sql.tableName}`) as Promise<any>,
    create: options => create(db, localDataFormat, options) as any,
    createManual: options => createManual(db, localDataFormat, options) as any,
    update: options => update(db, localDataFormat, options) as any,
    delete: options => _delete(db, localDataFormat, options) as any,
    count: options => count(db, localDataFormat, options),
    exists: options => exists(db, localDataFormat, options),
    get: options => getSingle(tsPgOrm as any, db, localDataFormat, options as AnyGetFunctionOptions<false>) as any,
    getMany: options => getMultiple(tsPgOrm as any, db, localDataFormat, options as AnyGetFunctionOptions<true>) as any,
  }
}
