import { DataQueryRecord } from '@samhuk/data-query/dist/types'
import { DataFormatDeclaration, DataFormatDeclarations } from '../../dataFormat/types'
import { RelationDeclarations } from '../../relations/types'

export type ExistsFunctionOptions<
  T extends DataFormatDeclaration = DataFormatDeclaration,
> = DataQueryRecord<T['fields'][number]['name']>

export type ExistsFunctionResult = Promise<boolean>

export type ExistsFunction<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number],
> = <TOptions extends ExistsFunctionOptions<L>>(
  options?: TOptions,
) => ExistsFunctionResult
