import { DataFilterNodeOrGroup } from '@samhuk/data-filter/dist/types'
import { CreateRecordOptions, DataFormatDeclarations, ManualCreateRecordOptions, ToRecord } from '../../dataFormat/types'
import { RelationDeclarations } from '../../relations/types'
import { GetSingleFunction, GetMultipleFunction } from './get'

export type UpdateSingleFunctionOptions<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  K extends RelationDeclarations<T> = RelationDeclarations<T>,
  L extends T[number] = T[number],
> = {
  /**
   * The fields to update with their new values.
   */
  record: Partial<ToRecord<L>>
  /**
   * Filter to select the single record to update.
   */
  filter: DataFilterNodeOrGroup<L['fields'][number]['name']>
  /**
   * Determines whether the updated record is returned
   */
  return?: boolean
}

export type UpdateSingleFunctionResult<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  K extends RelationDeclarations<T> = RelationDeclarations<T>,
  L extends T[number] = T[number],
  TOptions extends UpdateSingleFunctionOptions<T, K, L> = UpdateSingleFunctionOptions<T, K, L>,
> = TOptions extends { return: boolean }
? TOptions['return'] extends true
  ? ToRecord<L> | null
  : boolean
: ToRecord<L> | null

type UpdateSingleFunction<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number],
> = <TOptions extends UpdateSingleFunctionOptions<T, K, L>>(
  options: TOptions,
) => UpdateSingleFunctionResult<T, K, L, TOptions>

export type DeleteSingleFunctionOptions<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  K extends RelationDeclarations<T> = RelationDeclarations<T>,
  L extends T[number] = T[number],
> = {
  /**
   * Filter to select the single record to update.
   */
  filter: DataFilterNodeOrGroup<L['fields'][number]['name']>
}

export type DeleteSingleFunctionResult<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  K extends RelationDeclarations<T> = RelationDeclarations<T>,
  L extends T[number] = T[number],
> = boolean

type DeleteSingleFunction<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number],
> = <TOptions extends DeleteSingleFunctionOptions<T, K, L>>(
  options: TOptions,
) => DeleteSingleFunctionResult<T, K, L>

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
  create: (options: CreateRecordOptions<Extract<T[number], { name: L }>>) => Promise<ToRecord<Extract<T[number], { name: L }>>>
  /**
   * Adds a new record, including auto-generated fields.
   */
  createManual: (options: ManualCreateRecordOptions<Extract<T[number], { name: L }>>) => Promise<ToRecord<Extract<T[number], { name: L }>>>
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
