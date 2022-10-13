import { DataFormat, DataFormats } from '../../../dataFormat/types'
import { Relations } from '../../../relations/types'
import { GetFunctionOptions } from './getFunctionOptions'
import { GetFunctionResult } from './getFunctionResult'

export type GetSingleFunction<
  TDataFormats extends DataFormats,
  TRelations extends Relations = Relations,
  TLocalDataFormat extends DataFormat = DataFormat,
> = <TGetFunctionOptions extends GetFunctionOptions<TDataFormats, TRelations, TLocalDataFormat, false>>(
  options: TGetFunctionOptions,
) => Promise<GetFunctionResult<TDataFormats, TRelations, TLocalDataFormat, false, TGetFunctionOptions>>

export type GetMultipleFunction<
  TDataFormats extends DataFormats,
  TRelations extends Relations = Relations,
  TLocalDataFormat extends DataFormat = DataFormat,
> = <TGetFunctionOptions extends GetFunctionOptions<TDataFormats, TRelations, TLocalDataFormat, true>>(
  options: TGetFunctionOptions,
) => Promise<GetFunctionResult<TDataFormats, TRelations, TLocalDataFormat, true, TGetFunctionOptions>>
