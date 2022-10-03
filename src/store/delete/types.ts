import { DataQueryRecord } from '@samhuk/data-query/dist/types'
import { ReturnModeRaw } from '../types'
import { DataFormat } from '../../dataFormat/types'
import { ToRecord } from '../../dataFormat/types/record'

export type DeleteFunctionOptions<
  TDataFormat extends DataFormat = DataFormat,
> = {
  /**
   * Data query to select the record(s) to delete.
   */
   query?: DataQueryRecord<TDataFormat['fieldNameList'][number]>
  /**
   * Determines whether the deleted record(s) are to be returned.
   *
   * If `false`, the count of deleted records is returned.
   *
   * This can be alternatively be defined as `'first'`, which will cause
   * only the first record to be returned. This is useful when it is expected
   * that only one record will be deleted.
   *
   * @default false
   */
   return?: ReturnModeRaw
}

export type DeleteFunctionResult<
  TLocalDataFormat extends DataFormat = DataFormat,
  TOptions extends DeleteFunctionOptions<TLocalDataFormat> = DeleteFunctionOptions<TLocalDataFormat>,
> = Promise<
  TOptions extends { return: boolean }
    ? TOptions['return'] extends true
      ? ToRecord<TLocalDataFormat>[] | null
      : number
    : TOptions extends { return: string }
      ? TOptions['return'] extends 'first'
        ? ToRecord<TLocalDataFormat>
        : number
      : number
>

export type DeleteFunction<
  TLocalDataFormat extends DataFormat = DataFormat,
> = <TOptions extends DeleteFunctionOptions<TLocalDataFormat>>(
  options?: TOptions,
) => DeleteFunctionResult<TLocalDataFormat, TOptions>
