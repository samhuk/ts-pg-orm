import { DataQueryRecord } from '@samhuk/data-query/dist/types'
import { DataFormat } from '../../dataFormat/types'

export type CountFunctionOptions<
  TDataFormat extends DataFormat = DataFormat,
> = DataQueryRecord<TDataFormat['fieldNameList'][number]>

export type CountFunctionResult = Promise<number>

export type CountFunction<
  TLocalDataFormat extends DataFormat = DataFormat,
> = <TOptions extends CountFunctionOptions<TLocalDataFormat>>(
  options?: TOptions,
) => CountFunctionResult
