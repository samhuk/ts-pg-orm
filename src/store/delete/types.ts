import { DataFilterNodeOrGroup } from '@samhuk/data-filter/dist/types'
import { DataFormatDeclaration, DataFormatDeclarations, ToRecord } from '../../dataFormat/types'
import { RelationDeclarations } from '../../relations/types'

export type DeleteFunctionOptions<
  T extends DataFormatDeclaration = DataFormatDeclaration,
> = {
  /**
   * Filter to select the single record to update.
   */
  filter: DataFilterNodeOrGroup<T['fields'][number]['name']>
  /**
   * Determines whether the deleted record is returned.
   *
   * @default false
   */
   return?: boolean
}

export type DeleteFunctionResult<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  K extends RelationDeclarations<T> = RelationDeclarations<T>,
  L extends T[number] = T[number],
  TOptions extends DeleteFunctionOptions<L> = DeleteFunctionOptions<L>,
> = TOptions extends { return: boolean }
? TOptions['return'] extends true
  ? ToRecord<L> | null
  : boolean
: ToRecord<L> | null

export type DeleteFunction<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number],
> = <TOptions extends DeleteFunctionOptions<L>>(
  options: TOptions,
) => DeleteFunctionResult<T, K, L, TOptions>
