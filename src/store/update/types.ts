import { DataQueryRecord } from '@samhuk/data-query/dist/types'
import { DataFormatDeclaration, ToRecord, DataFormatDeclarations } from '../../dataFormat/types'
import { RelationDeclarations } from '../../relations/types'
import { ReturnModeRaw } from '../common/types'

export type UpdateFunctionOptions<
  T extends DataFormatDeclaration = DataFormatDeclaration,
> = {
  /**
   * The field(s) to update with their new values.
   */
  record: Partial<ToRecord<T>>
  /**
   * Data query to select the record(s) to update.
   */
  query?: DataQueryRecord<T['fields'][number]['name']>
  /**
   * Determines whether the updated record(s) are to be returned.
   *
   * If `false`, the count of updated records is returned.
   *
   * This can be alternatively be defined as `'first'`, which will cause
   * only the first record to be returned. This is useful when it is expected
   * that only one record will be updated.
   *
   * @default false
   */
  return?: ReturnModeRaw
}

export type UpdateFunctionResult<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  K extends RelationDeclarations<T> = RelationDeclarations<T>,
  L extends T[number] = T[number],
  TOptions extends UpdateFunctionOptions<L> = UpdateFunctionOptions<L>,
> = TOptions extends { return: boolean }
? TOptions['return'] extends true
  ? ToRecord<L>[] | null
  : number
: TOptions extends { return: string }
  ? TOptions['return'] extends 'first'
    ? ToRecord<L>
    : number
  : number

export type UpdateFunction<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number],
> = <TOptions extends UpdateFunctionOptions<L>>(
  options: TOptions,
) => UpdateFunctionResult<T, K, L, TOptions>
