import { DataFormatDeclarations } from '../../dataFormat/types'
import { RelationDeclarations } from '../../relations/types'
import { DbService } from '../../types'
import { StoreOptions } from '../types'

export type DbStoreOptions<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  // The chosen data format declaration name
  L extends T[number]['name'],
> = StoreOptions<T, K, L> & {
  db: DbService
}
