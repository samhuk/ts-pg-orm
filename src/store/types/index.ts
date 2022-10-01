import { DataFormat, DataFormats } from '../../dataFormat/types'
import { Relations } from '../../relations/types'
import { CountFunction } from '../count/types'
import { CreateManualSingleFunction, CreateSingleFunction } from '../create/types'
import { DeleteFunction } from '../delete/types'
import { ExistsFunction } from '../exists/types'
import { GetMultipleFunction, GetSingleFunction } from '../get/types'
import { UpdateFunction } from '../update/types'

export enum ReturnMode {
  RETURN_ALL_ROWS,
  RETURN_FIRST_ROW,
  RETURN_COUNT,
}

export type ReturnModeRaw = boolean | 'first'

type _Store<
  TDataFormats extends DataFormats,
  TRelations extends Relations,
  TLocalDataFormat extends DataFormat,
> = {
  /**
   * Adds a new record, excluding auto-generated fields.
   */
  create: CreateSingleFunction<TLocalDataFormat>
  /**
   * Adds a new record, including auto-generated fields.
   */
  createManual: CreateManualSingleFunction<TLocalDataFormat>
  /**
   * Retreives a single record, optionally including related data.
   */
  get: GetSingleFunction<TDataFormats, TRelations, TLocalDataFormat>
  /**
   * Retreives multiple records, optionally including related data.
   */
  getMany: GetMultipleFunction<TDataFormats, TRelations, TLocalDataFormat>
  /**
   * Updates records according to the given query.
   */
  update: UpdateFunction<TLocalDataFormat>
  /**
  * Deletes a single record.
  */
  delete: DeleteFunction<TLocalDataFormat>
  /**
  * Counts the number of records that exists that correspond to the given query.
  */
  count: CountFunction<TLocalDataFormat>
  /**
  * Determines if there is at least one record corresponding to the given query.
  *
  * Note that this is almost an alias of using `count` with a `pageSize` of `1`.
  */
  exists: ExistsFunction<TLocalDataFormat>
}

export type Store<
  TDataFormats extends DataFormats,
  TRelations extends Relations,
  TLocalDataFormatName extends string,
> = _Store<TDataFormats, TRelations, TDataFormats[TLocalDataFormatName]>
