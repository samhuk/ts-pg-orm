import { ValuesUnionFromDict } from '../../../helpers/types'
import { DataFormats } from '../../dataFormat/types'
import { Relations } from '../../relations/types'
import { GetMultipleFunction, GetSingleFunction } from '../get/types'

export type Store<
  TDataFormats extends DataFormats,
  TRelations extends Relations,
  TLocalDataFormatName extends string,
> = {
  /**
   * Retreives a single record, optionally including related data.
   */
  get: GetSingleFunction<TDataFormats, TRelations, Extract<ValuesUnionFromDict<TDataFormats>, { name: TLocalDataFormatName }>>
  /**
   * Retreives multiple records, optionally including related data.
   */
  getMany: GetMultipleFunction<TDataFormats, TRelations, Extract<ValuesUnionFromDict<TDataFormats>, { name: TLocalDataFormatName }>>
}
