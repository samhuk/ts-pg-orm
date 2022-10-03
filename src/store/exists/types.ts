import { DataQueryRecord } from '@samhuk/data-query/dist/types'
import { DataFormat } from '../../dataFormat/types'

export type ExistsFunctionOptions<
  TDataFormat extends DataFormat = DataFormat,
> = DataQueryRecord<TDataFormat['fieldNameList'][number]>

export type ExistsFunctionResult = Promise<boolean>

export type ExistsFunction<
  TLocalDataFormat extends DataFormat = DataFormat
> = <TOptions extends ExistsFunctionOptions<TLocalDataFormat>>(
  options?: TOptions,
) => ExistsFunctionResult
