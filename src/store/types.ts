import { DataFormatDeclarations } from '../dataFormat/types'
import { RelationDeclarations } from '../relations/types'
import { CountFunction } from './count/types'
import { CreateSingleFunction, CreateManualSingleFunction } from './create/types'
import { DeleteFunction } from './delete/types'
import { ExistsFunction } from './exists/types'
import { GetSingleFunction, GetMultipleFunction } from './get/types'
import { UpdateFunction } from './update/types'

export type Store<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  /**
   * Creates the table for the store.
   */
  provision: () => Promise<void>
  /**
   * Drops the table for the store.
   */
  unprovision: () => Promise<void>
  /**
   * Adds a new record, excluding auto-generated fields.
   */
  create: CreateSingleFunction<T, K, Extract<T[number], { name: L }>>
  /**
   * Adds a new record, including auto-generated fields.
   */
  createManual: CreateManualSingleFunction<T, K, Extract<T[number], { name: L }>>
  /**
   * Retreives a single record, optionally including related data.
   */
  get: GetSingleFunction<T, K, Extract<T[number], { name: L }>>
  /**
  * Retreives multiple records, optionally including related data.
  */
  getMany: GetMultipleFunction<T, K, Extract<T[number], { name: L }>>
  /**
   * Updates records according to the given query.
   */
  update: UpdateFunction<T, K, Extract<T[number], { name: L }>>
  /**
   * Deletes a single record.
   */
  delete: DeleteFunction<T, K, Extract<T[number], { name: L }>>
  /**
   * Counts the number of records that exists that correspond to the given query.
   */
  count: CountFunction<T, K, Extract<T[number], { name: L }>>
  /**
   * Determines if there is at least one record corresponding to the given query.
   *
   * Note that this is almost an alias of using `count` with a `pageSize` of `1`.
   */
  exists: ExistsFunction<T, K, Extract<T[number], { name: L }>>
}
