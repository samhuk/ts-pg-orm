import { DataFormatDeclarations } from '../dataFormat/types'
import { RelationDeclarations } from '../relations/types'
import { CountFunction } from './count/types'
import { CreateSingleFunction, CreateManualSingleFunction } from './create/types'
import { DeleteSingleFunction } from './delete/types'
import { ExistsFunction } from './exists/types'
import { GetSingleFunction, GetMultipleFunction } from './get/types'
import { UpdateSingleFunction } from './update/types'

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
   * Updates a single record.
   *
   */
  updateSingle: UpdateSingleFunction<T, K, Extract<T[number], { name: L }>>
  /**
   * Deletes a single record.
   *
   * @deprecated since 4.3.0. Use `delete()` instead.
   */
  deleteSingle: DeleteSingleFunction<T, K, Extract<T[number], { name: L }>>
  /**
   * Retreives a single record, optionally including related data.
   *
   * @deprecated since 4.3.0. Use `get()` instead.
   */
  getSingle: GetSingleFunction<T, K, Extract<T[number], { name: L }>>
  /**
   * Retreives multiple records, optionally including related data.
   *
   * @deprecated since 4.3.0. Use `getMany()` instead.
   */
  getMultiple: GetMultipleFunction<T, K, Extract<T[number], { name: L }>>

  // -- 4.3.0 renamed functions

  // TODO:
  // /**
  //  * Retreives a single record, optionally including related data.
  //  */
  // get: GetSingleFunction<T, K, Extract<T[number], { name: L }>>
  // /**
  // * Retreives multiple records, optionally including related data.
  // */
  // getMany: GetMultipleFunction<T, K, Extract<T[number], { name: L }>>
  // /**
  //  * Updates a single record.
  //  */
  // update: UpdateSingleFunction<T, K, Extract<T[number], { name: L }>>
  // /**
  //  * Updates (optionally) multiple records.
  //  */
  // updateMany: UpdateSingleFunction<T, K, Extract<T[number], { name: L }>>
  // /**
  //  * Deletes a single record.
  //  */
  // delete: DeleteSingleFunction<T, K, Extract<T[number], { name: L }>>
  // /**
  //  * Deletes (optionally) multiple records.
  //  */
  // deleteMany: DeleteSingleFunction<T, K, Extract<T[number], { name: L }>>

  // -- 4.3.0 totally new functions

  /**
   * Counts the number of records that exist that correspond to the given query.
   */
  count: CountFunction<T, K, Extract<T[number], { name: L }>>
  /**
   * Determines if there is at least one record corresponding to the given query.
   */
  exists: ExistsFunction<T, K, Extract<T[number], { name: L }>>
}
