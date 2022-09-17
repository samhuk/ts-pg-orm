import { CreateRecordOptions, DataFormatDeclaration, DataFormatDeclarations, ManualCreateRecordOptions, ToRecord } from '../../dataFormat/types'
import { RelationDeclarations } from '../../relations/types'

export type CreateSingleFunctionOptions<
  T extends DataFormatDeclaration = DataFormatDeclaration,
> = CreateRecordOptions<T>

export type CreateSingleFunctionResult<
  T extends DataFormatDeclaration = DataFormatDeclaration,
> = Promise<ToRecord<T>>

export type CreateSingleFunction<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number],
> = <TOptions extends CreateSingleFunctionOptions<L>>(
  options: TOptions,
) => CreateSingleFunctionResult<L>

export type CreateManualSingleFunctionOptions<
  T extends DataFormatDeclaration = DataFormatDeclaration,
> = ManualCreateRecordOptions<T>

export type CreateManualSingleFunctionResult<
  T extends DataFormatDeclaration = DataFormatDeclaration,
> = Promise<ToRecord<T>>

export type CreateManualSingleFunction<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number],
> = <TOptions extends CreateManualSingleFunctionOptions<L>>(
  options: TOptions,
) => CreateManualSingleFunctionResult<L>
