import { SimplePgClientOptions, SimplePgClient, SimplePgClientFromClientOptions } from 'simple-pg-client/dist/types'
import { DataFormatList, DataFormatsFromOptions } from '../dataFormatNew/types'
import { RelationList, RelationOptionsList, RelationsFromOptions } from '../relationNew/types'

export type Orm<
  TDataFormatList extends DataFormatList = DataFormatList,
  TDataFormatsFromOptions extends DataFormatsFromOptions<TDataFormatList> = DataFormatsFromOptions<TDataFormatList>,
  // eslint-disable-next-line max-len
  TRelationOptionsList extends RelationOptionsList<TDataFormatList, TDataFormatsFromOptions> = RelationOptionsList<TDataFormatList, TDataFormatsFromOptions>
> = {
  dataFormatList: TDataFormatList
  dataFormats: TDataFormatsFromOptions
  relationList: RelationList
  relations: RelationsFromOptions<TDataFormatList, TDataFormatsFromOptions, TRelationOptionsList>
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
  createStores: () => void
}

type _OrmWithDataFormats<
  TDataFormatList extends DataFormatList = DataFormatList,
  TDataFormatsFromOptions extends DataFormatsFromOptions<TDataFormatList> = DataFormatsFromOptions<TDataFormatList>
> = {
  dataFormatList: TDataFormatList
  dataFormats: TDataFormatsFromOptions
  defineRelations: <TRelationOptionsList extends RelationOptionsList<TDataFormatList, TDataFormatsFromOptions>>(
    relationOptionsListCreator: ((
      dataFormats: TDataFormatsFromOptions
    ) => TRelationOptionsList) | RelationOptionsList<TDataFormatList, TDataFormatsFromOptions>,
  ) => Orm<TDataFormatList, TDataFormatsFromOptions, TRelationOptionsList>
}

export type OrmWithDataFormats<TDataFormatList extends DataFormatList> = _OrmWithDataFormats<
  TDataFormatList,
  DataFormatsFromOptions<TDataFormatList>
>

export type EmptyOrm = {
  defineDataFormats: <TDataFormatList extends DataFormatList>(
    dataFormatList: TDataFormatList,
  ) => OrmWithDataFormats<TDataFormatList>
}
