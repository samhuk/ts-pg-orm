import { DataQueryRecord } from '@samhuk/data-query/dist/types'
import { DataFormatDeclaration, DataFormatDeclarations } from '../../dataFormat/types'
import { RelationDeclarations } from '../../relations/types'

export type CountFunctionOptions<
  T extends DataFormatDeclaration = DataFormatDeclaration,
> = DataQueryRecord<T['fields'][number]['name']>

export type CountFunctionResult = Promise<number>

export type CountFunction<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number],
> = <TOptions extends CountFunctionOptions<L>>(
  options?: TOptions,
) => CountFunctionResult
