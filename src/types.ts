import { SimplePgClient, SimplePgClientOptions } from 'simple-pg-client/dist/types'
import { DataFormatDeclarations, DataFormatsDict } from './dataFormat/types'
import { RelationDeclarations, RelationsDict, ExtractRelationNamesOfManyToManyRelations } from './relations/types'
import { Store } from './store/types'

export type UnloadedTsPgOrm = {
  /**
   * Loads the provided data format declarations.
   */
  loadDataFormats: <T extends DataFormatDeclarations>(declarations: T) => TsPgOrmWithDataFormats<T>
}

export type TsPgOrmWithDataFormats<T extends DataFormatDeclarations> = {
  /**
   * The Data Formats that have been loaded.
   */
  dataFormats: DataFormatsDict<T>
  /**
   * Loads the provided relation declarations that is created by `relationDeclarationsCreator`.
   * Use the field refs of the provided data formats to create the relations easily.
   */
  loadRelations: <K extends RelationDeclarations<T>>(
    relationDeclarationsCreator: (dataFormats: DataFormatsDict<T>) => K,
  ) => TsPgOrm<T, K>
}

export type StoresDict<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  K extends RelationDeclarations<T> = RelationDeclarations<T>,
> = {
  [TName in keyof DataFormatsDict<T>]: Store<T, K, (TName & string)>
}

export type CreateStoresOptions<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  K extends RelationDeclarations<T> = RelationDeclarations<T>,
> = {
  /**
   * The order to provision the entity stores
   */
  provisionOrder: (keyof StoresDict<T, K>)[],
  /**
   * `true` to first unprovision entity stores (i.e. drop tables) before provisioning.
   *
   * Alternatively, an array of entity names can be provided which will define which
   * stores are first unprovisioned.
   *
   * Default: `false`
   */
  unprovisionStores?: boolean | (keyof StoresDict<T, K>)[],
  /**
   * Optional alternative `SimplePgClient` to use, different from the one initially provided
   * to create the TsPgOrm instance.
   */
  db?: SimplePgClient,
}

/**
 * A TsPgOrm instance with the loaded Data Formats and Relations.
 */
export type TsPgOrm<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  K extends RelationDeclarations<T> = RelationDeclarations<T>,
> = {
  /**
   * The default `SimplePgClient` that will be used for all database-related
   * functionality. This can optionally be overridden in functions like `createStore`
   * and `createJoinTables`.
   */
  db?: SimplePgClient
  /**
   * Creates an instance of `SimplePgClient` from the given options, setting
   * it to the current instance of `TsPgOrm`, becoming the default DB client
   * that is used for database-related functionality, e.g. functions like
   * `createStore` and `createJoinTables`.
   */
  initDbClient: (options: SimplePgClientOptions) => Promise<SimplePgClient>
  /**
   * Sets the `SimplePgClient` instance to use, setting it to the current `TsPgOrm`
   * instance, becoming the default DB client that is used for database-related
   * functionality, e.g. functions like `createStore` and `createJoinTables`.
   */
  setDbClient: (newDbClient: SimplePgClient) => void
  /**
   * The loaded Data Formats.
   */
  dataFormats: DataFormatsDict<T>
  /**
   * The loaded Relations between all of the Data Formats.
   */
  relations: RelationsDict<T, K>
  /**
   * The original list of Data Format Declarations that was loaded.
   */
  dataFormatDeclarations: T,
  /**
   * The original list of Relation Declarations that was loaded.
   */
  relationDeclarations: K
  /**
   * PostgreSQL-related information and functionality
   */
  sql: {
    /**
     * Drop a particular join table.
     */
    dropJoinTable: (relationName: ExtractRelationNamesOfManyToManyRelations<K>, db?: SimplePgClient) => Promise<boolean>
    /**
     * Create a particular join table.
     */
    createJoinTable: (relationName: ExtractRelationNamesOfManyToManyRelations<K>, db?: SimplePgClient) => Promise<boolean>
    /**
     * Drop all join tables.
     */
    dropJoinTables: (db?: SimplePgClient) => Promise<boolean>
    /**
     * Create all join tables.
     */
    createJoinTables: (db?: SimplePgClient) => Promise<boolean>
    /**
     * Creates then provisions entity DB stores for all loaded data formats and relations, returning a dictionary of stores.
     *
     * Optionally, stores can be first unprovisioned (i.e. drop table) before provisioning.
     *
     * Warning: This will wipe all data in existing tables.
     */
    createStores: (options: CreateStoresOptions<T, K>) => Promise<StoresDict<T, K>>
  }
}
