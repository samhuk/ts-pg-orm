import { DataQueryRecord } from '@samhuk/data-query/dist/types'
import { DataFormat } from '../../dataFormat/types'
import { ToRecord } from '../../dataFormat/types/record'
import { ReturnModeRaw } from '../types'

export type UpdateFunctionOptions<
  TDataFormat extends DataFormat = DataFormat,
> = {
  /**
   * The field(s) to update with their new values.
   */
  record: Partial<ToRecord<TDataFormat['fields']>>
  /**
   * Data query to select the record(s) to update.
   */
  query?: DataQueryRecord<TDataFormat['fieldNameList'][number]>
  /**
   * Determines whether the updated record(s) are to be returned.
   *
   * If `false`, the count of updated records is returned.
   *
   * This can be alternatively be defined as `'first'`, which will cause
   * only the first record to be returned. This is useful when it is expected
   * that only one record will be updated.
   *
   * @default false
   */
  return?: ReturnModeRaw
}

export type UpdateFunctionResult<
  TLocalDataFormat extends DataFormat = DataFormat,
  TOptions extends UpdateFunctionOptions<TLocalDataFormat> = UpdateFunctionOptions<TLocalDataFormat>,
> = Promise<
  TOptions extends { return: boolean }
    ? TOptions['return'] extends true
      ? ToRecord<TLocalDataFormat['fields']>[] | null
      : number
    : TOptions extends { return: string }
      ? TOptions['return'] extends 'first'
        ? ToRecord<TLocalDataFormat['fields']>
        : number
      : number
>

export type UpdateFunction<
  TLocalDataFormat extends DataFormat = DataFormat,
> = <TOptions extends UpdateFunctionOptions<TLocalDataFormat>>(
  options: TOptions,
) => UpdateFunctionResult<TLocalDataFormat, TOptions>
