import { DataQueryRecord } from '@samhuk/data-query/dist/types'
import { DataFormatDeclaration, DataFormatDeclarations, ToRecord } from '../../dataFormat/types'
import { RelationDeclarations } from '../../relations/types'
import { ReturnModeRaw } from '../common/types'

export type DeleteFunctionOptions<
  T extends DataFormatDeclaration = DataFormatDeclaration,
> = {
  /**
   * Data query to select the record(s) to delete.
   */
   query?: DataQueryRecord<T['fields'][number]['name']>
  /**
   * Determines whether the deleted record(s) are to be returned.
   *
   * If `false`, the count of deleted records is returned.
   *
   * This can be alternatively be defined as `'first'`, which will cause
   * only the first record to be returned. This is useful when it is expected
   * that only one record will be deleted.
   *
   * @default false
   */
   return?: ReturnModeRaw
}

export type DeleteFunctionResult<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  K extends RelationDeclarations<T> = RelationDeclarations<T>,
  L extends T[number] = T[number],
  TOptions extends DeleteFunctionOptions<L> = DeleteFunctionOptions<L>,
> = TOptions extends { return: boolean }
? TOptions['return'] extends true
  ? ToRecord<L>[] | null
  : number
: TOptions extends { return: string }
  ? TOptions['return'] extends 'first'
    ? ToRecord<L>
    : number
  : number

export type DeleteFunction<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number],
> = <TOptions extends DeleteFunctionOptions<L>>(
  options?: TOptions,
) => DeleteFunctionResult<T, K, L, TOptions>
