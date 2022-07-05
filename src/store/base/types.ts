import { DataQuery } from '@samhuk/data-query/dist/types'
import {
  DataFormatDeclaration,
  CreateRecordOptions,
  ToRecord,
  ManualCreateRecordOptions,
  DataFormat,
} from '../../dataFormat/types'

export type StoreBaseOptions<T extends DataFormatDeclaration> = {
  dataFormat: DataFormat<T>
}

export type StoreBase<
  T extends DataFormatDeclaration
> = {
  add: (options: CreateRecordOptions<T>) => Promise<ToRecord<T>>
  addManual: (options: ManualCreateRecordOptions<T>) => Promise<ToRecord<T>>
  deleteByUuid: (uuid: string) => Promise<boolean>
  getById: (id: number) => Promise<ToRecord<T>>
  getByUuid: (uuid: string) => Promise<ToRecord<T>>
  getByDataQuery: (query: DataQuery) => Promise<ToRecord<T>[]>
  addRandomRecords: (count: number) => Promise<ToRecord<T>[]>
}
