import { DataFormat } from '../../dataFormat/types'
import { CreateRecordOptions, ManualCreateRecordOptions } from '../../dataFormat/types/createRecordOptions'
import { ToRecord } from '../../dataFormat/types/record'

export type CreateSingleFunctionOptions<
  TDataFormat extends DataFormat = DataFormat
> = CreateRecordOptions<TDataFormat>

export type CreateSingleFunctionResult<
  TDataFormat extends DataFormat = DataFormat
> = Promise<ToRecord<TDataFormat>>

export type CreateSingleFunction<
  TLocalDataFormat extends DataFormat = DataFormat,
> = <TOptions extends CreateSingleFunctionOptions<TLocalDataFormat>>(
  options: TOptions,
) => CreateSingleFunctionResult<TLocalDataFormat>

export type CreateManualSingleFunctionOptions<
  TDataFormat extends DataFormat = DataFormat
> = ManualCreateRecordOptions<TDataFormat>

export type CreateManualSingleFunctionResult<
  TDataFormat extends DataFormat = DataFormat
> = Promise<ToRecord<TDataFormat>>

export type CreateManualSingleFunction<
  TLocalDataFormat extends DataFormat = DataFormat,
> = <TOptions extends CreateManualSingleFunctionOptions<TLocalDataFormat>>(
  options: TOptions,
) => CreateManualSingleFunctionResult<TLocalDataFormat>
