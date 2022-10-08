import { SimplePgClient, SimplePgClientFromClientOptions, SimplePgClientOptions } from 'simple-pg-client/dist/types'
import { DataFormats } from './dataFormat/types'
import { RelationOptionsList, Relations } from './relations/types'
import { ProvisionStoresOptions, StoresAndJoinTableStores, UnprovisionStoresOptions } from './stores/types'
import { VersionTransforms, VersionTransformsOptions } from './versioning/types'

type IsObjectNonEmpty<Obj extends Record<PropertyKey, unknown>> = [keyof Obj] extends [never] ? false : true

type IncludeIfObjectIsEmpty<Obj extends Record<PropertyKey, unknown>, ObjToInclude> =
  IsObjectNonEmpty<Obj> extends true ? {} : ObjToInclude

type IncludeIfObjectIsNotEmpty<Obj extends Record<PropertyKey, unknown>, ObjToInclude>
  = IsObjectNonEmpty<Obj> extends true ? ObjToInclude : {}

type IncludeIfTrue<TBool extends boolean, ObjToInclude> = TBool extends true ? ObjToInclude : {}

export type ConnectedTsPgOrm<TTsPgOrm extends TsPgOrm = TsPgOrm> =
  TsPgOrm<TTsPgOrm['dataFormats'], TTsPgOrm['relations'], TTsPgOrm['versionTransforms'], true>

export type TsPgOrm<
  TDataFormats extends DataFormats | {} = DataFormats,
  TRelations extends Relations | {} = Relations,
  TVersionTransforms extends VersionTransforms | {} = VersionTransforms,
  TConnected extends boolean = boolean,
> =
// Initially, only data formats and their order are present.
{
  /**
   * The order that the Data Formats were defined for the ORM.
   */
  dataFormatOrder: ((keyof TDataFormats) & string)[]
  /**
   * The currently defined Data Formats of the ORM.
   */
  dataFormats: TDataFormats
}
/* Before relations are defined, the function to set them is present.
 * After they are defined, that function goes away and instead the set
 * relations are present, along with functions to create store
 * provisioning sql.
 */
& IncludeIfObjectIsNotEmpty<TRelations, {
  /**
   * The currently defined Relations of the ORM.
   */
  relations: TRelations
  /**
   * Creates the sql necessary to provision the data stores.
   */
  createProvisionStoresSql: (options?: ProvisionStoresOptions<TDataFormats, TRelations>) => string
  /**
   * Creates the sql necessary to unprovision the data stores.
   */
  createUnprovisionStoresSql: (options?: UnprovisionStoresOptions<TDataFormats, TRelations>) => string
}>
& IncludeIfObjectIsEmpty<TRelations, {
  /**
   * Defines the relations of the ORM.
   */
  setRelations: <TRelationOptionsList extends RelationOptionsList<TDataFormats>>(
    relationOptionsList: TRelationOptionsList
  ) => TsPgOrm<TDataFormats, Relations<TDataFormats, TRelationOptionsList>, TVersionTransforms, TConnected>
}>
/* Once relations are defined, properties that are reliant on both data formats
 * and relations are present.
 */
& IncludeIfObjectIsNotEmpty<TRelations, (
  {
    /**
     * Connects the ORM instance to the defined PostgreSQL database server.
     */
    connect: (simplePgClientOptions: SimplePgClientOptions) => Promise<TsPgOrm<TDataFormats, TRelations, TVersionTransforms, true>>
    /**
     * Connects the ORM instance to the defined PostgreSQL database server using the
     * provided `Client` instance from the `pg` npm package.
     *
     * This is for when you already have a connected and ready-to-use `SimplePgClient` instance
     * (from the `simple-pg-client` package) available to provide.
     */
    provideDbClient: (ngSimplePgClient: SimplePgClient) => TsPgOrm<TDataFormats, TRelations, TVersionTransforms, true>
    /**
     * For use when you already have a connected and ready-to-use `Client` instance
     * (from the `pg` package) available to provide.
     */
    providePgClient: (options: SimplePgClientFromClientOptions) => TsPgOrm<TDataFormats, TRelations, TVersionTransforms, true>
  }
  /* Once one of the db-connecting functions have been run, the db client instead is present
    * along with the stores dict and store provisioning/unprovisioning functions.
    */
  & IncludeIfTrue<TConnected, {
    /**
     * The currently defined database client instance.
     */
    db: SimplePgClient
    /**
     * The available data stores to perform CRUD operations on.
     */
    stores: StoresAndJoinTableStores<TDataFormats, TRelations>
    /**
     * Creates the sql tables and other artifacts required for the data stores.
     */
    provisionStores: (options?: ProvisionStoresOptions<TDataFormats, TRelations>) => Promise<void>
    /**
     * Removes (i.e. drops) the sql tables and other artifacts required for the data stores.
     */
    unprovisionStores: (stores?: UnprovisionStoresOptions<TDataFormats, TRelations>) => Promise<void>
  }>
  /* Once relations are defined but before version transforms are defined, a function
    * to set them appears. Once version transforms are set, they are present.
    */
  & IncludeIfObjectIsNotEmpty<TVersionTransforms, {
    /**
     * The currently defined version transforms of the ORM.
     */
    versionTransforms: TVersionTransforms
  }>
  & IncludeIfObjectIsEmpty<TVersionTransforms, {
    /**
     * Defines the version transforms of the ORM.
     */
    setVersionTransforms: <TVersionTransformsOptions extends VersionTransformsOptions>(
      options: TVersionTransformsOptions
    ) => TsPgOrm<TDataFormats, TRelations, VersionTransforms<TVersionTransformsOptions>, TConnected>
  }>
)>
