import { DataFormatDeclarations } from '../dataFormat/types'
import { RelationDeclarations } from '../relations/types'
import { CreateSingleFunction, CreateManualSingleFunction } from './create/types'
import { DeleteSingleFunction } from './delete/types'
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
   */
  updateSingle: UpdateSingleFunction<T, K, Extract<T[number], { name: L }>>
  /**
   * Deletes a single record.
   */
  deleteSingle: DeleteSingleFunction<T, K, Extract<T[number], { name: L }>>
  /**
   * Retreives a single record, optionally including related data.
   */
  getSingle: GetSingleFunction<T, K, Extract<T[number], { name: L }>>
  /**
   * Retreives multiple records, optionally including related data.
   */
  getMultiple: GetMultipleFunction<T, K, Extract<T[number], { name: L }>>
}
