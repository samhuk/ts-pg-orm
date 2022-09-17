import { DataFilterNodeOrGroup } from '@samhuk/data-filter/dist/types'
import { DataFormatDeclaration, ToRecord, DataFormatDeclarations } from '../../dataFormat/types'
import { RelationDeclarations } from '../../relations/types'

export type UpdateSingleFunctionOptions<
  T extends DataFormatDeclaration = DataFormatDeclaration,
> = {
  /**
   * The fields to update with their new values.
   */
  record: Partial<ToRecord<T>>
  /**
   * Filter to select the single record to update.
   */
  filter: DataFilterNodeOrGroup<T['fields'][number]['name']>
  /**
   * Determines whether the updated record is returned.
   *
   * @default false
   */
  return?: boolean
}

export type UpdateSingleFunctionResult<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  K extends RelationDeclarations<T> = RelationDeclarations<T>,
  L extends T[number] = T[number],
  TOptions extends UpdateSingleFunctionOptions<L> = UpdateSingleFunctionOptions<L>,
> = TOptions extends { return: boolean }
? TOptions['return'] extends true
  ? ToRecord<L> | null
  : boolean
: boolean

export type UpdateSingleFunction<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number],
> = <TOptions extends UpdateSingleFunctionOptions<L>>(
  options: TOptions,
) => UpdateSingleFunctionResult<T, K, L, TOptions>
