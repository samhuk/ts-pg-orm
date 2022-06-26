import { DataQuery } from '@samhuk/data-query/dist/types'
import {
  DataFormatDeclaration,
  CreateRecordOptions,
  DataFormatDeclarationToRecord,
  ManualCreateRecordOptions,
  DataFormat,
} from '../../dataFormat/types'

export type StoreBaseOptions<T extends DataFormatDeclaration> = {
  dataFormat: DataFormat<T>
}

export type StoreBase<
  T extends DataFormatDeclaration
> = {
  add: (options: CreateRecordOptions<T>) => Promise<DataFormatDeclarationToRecord<T>>
  addManual: (options: ManualCreateRecordOptions<T>) => Promise<DataFormatDeclarationToRecord<T>>
  deleteByUuid: (uuid: string) => Promise<boolean>
  getById: (id: number) => Promise<DataFormatDeclarationToRecord<T>>
  getByUuid: (uuid: string) => Promise<DataFormatDeclarationToRecord<T>>
  getByDataQuery: (query: DataQuery) => Promise<DataFormatDeclarationToRecord<T>[]>
  addRandomRecords: (count: number) => Promise<DataFormatDeclarationToRecord<T>[]>
}
