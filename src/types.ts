import { SimplePgClient, SimplePgClientFromClientOptions, SimplePgClientOptions } from 'simple-pg-client/dist/types'
import { DataFormatList, DataFormats } from './dataFormat/types'
import { RelationOptionsList, Relations } from './relations/types'
import { ProvisionStoresOptions, StoresAndJoinTableStoresDict, UnprovisionStoresOptions } from './stores/types'

export type TsPgOrmWithNoRelations<TDataFormatList extends DataFormatList> = {
  dataFormats: DataFormats<TDataFormatList>
  setRelations: <TRelationOptionsList extends RelationOptionsList<DataFormats<TDataFormatList>>>(
    relationOptionsList: TRelationOptionsList
  ) => TsPgOrm<DataFormats<TDataFormatList>, Relations<DataFormats<TDataFormatList>, TRelationOptionsList>>
}

export type TsPgOrm<
  TDataFormats extends DataFormats = DataFormats,
  TRelations extends Relations = Relations,
> = {
  /**
   * The default `SimplePgClient` that will be used for all database-related
   * functionality. This can optionally be overridden in functions like `createStore`
   * and `createJoinTables`.
   */
  db?: SimplePgClient
  /**
   * Creates an instance of `SimplePgClient` from the given `SimplePgClientOptions`,
   * setting it to the current instance of `TsPgOrm`, becoming the default DB client
   * that is used for database-related functionality, e.g. functions like `createStore`
   * and `createJoinTables`.
   */
  initDbClient: (options: SimplePgClientOptions) => Promise<SimplePgClient>
  /**
   * Sets the `SimplePgClient` instance to use, setting it to the current `TsPgOrm`
   * instance, becoming the default DB client that is used for database-related
   * functionality, e.g. functions like `createStore` and `createJoinTables`.
   */
  setDbClient: (newDbClient: SimplePgClient) => void
  /**
   * Creates an instance of `SimplePgClient` from the given `SimplePgClientFromClientOptions`,
   * setting it to the current instance of `TsPgOrm`, becoming the default DB client
   * that is used for database-related functionality, e.g. functions like `createStore`
   * and `createJoinTables`.
   *
   * This is an alternative to `setDbClient`, where the `Client` instance (from `pg`) can
   * be directly provided, instead of `SimplePgClientOptions`.
   *
   * This is useful for if you already have a connected and ready-to-use `Client` instance
   * available to give to `TsPgOrm`.
   */
  setDbClientByClient: (newDbClient: SimplePgClientFromClientOptions) => void
  dataFormatOrder: ((keyof TDataFormats) & string)[]
  dataFormats: TDataFormats,
  relations: TRelations,
  stores: StoresAndJoinTableStoresDict<TDataFormats, TRelations>
  provisionStores: (options?: ProvisionStoresOptions<TDataFormats, TRelations>) => Promise<void>
  createProvisionStoresSql: (options?: ProvisionStoresOptions<TDataFormats, TRelations>) => string
  unprovisionStores: (stores?: UnprovisionStoresOptions<TDataFormats, TRelations>) => Promise<void>
  createUnprovisionStoresSql: (options?: UnprovisionStoresOptions<TDataFormats, TRelations>) => string
}
