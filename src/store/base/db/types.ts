import { DataFormatDeclaration } from '../../../dataFormat/types'
import { DbService } from '../../../types'
import { StoreBaseOptions } from '../types'

export type DbStoreBaseOptions<T extends DataFormatDeclaration> = StoreBaseOptions<T> & {
  db: DbService
}
