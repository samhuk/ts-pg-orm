import { DataFormatDeclarations, DataFormatsDict } from './dataFormat/types'
import { RelationDeclarations, RelationsDict, ExtractRelationNamesOfManyToManyRelations } from './relations/types'
import { Store } from './store/types'

export type UnloadedEntities = {
  /**
   * Loads the provided data format declarations.
   */
  loadDataFormats: <T extends DataFormatDeclarations>(declarations: T) => EntitiesWithDataFormats<T>
}

export type EntitiesWithDataFormats<T extends DataFormatDeclarations> = {
  /**
   * The Data Formats that have been loaded.
   */
  dataFormats: DataFormatsDict<T>
  /**
   * Loads the provided relation declarations that is created by `relationDeclarationsCreator`.
   * Use the field refs of the provided data formats to create the relations easily.
   */
  loadRelations: <K extends RelationDeclarations<T>>(relationDeclarationsCreator: (dataFormats: DataFormatsDict<T>) => K) => Entities<T, K>
}

export type DbServiceQueryResult<TRow> = {
  rows: TRow[]
  rowCount: number
}

/**
 * A generic database client service.
 */
export type DbService = {
  /**
   * Base query function that returns rows and rowCount.
   */
  query: <TRow extends any>(sql: string, parameters?: any[]) => Promise<DbServiceQueryResult<TRow>>
  /**
   * Query then returns all rows.
   */
  queryGetRows: <TRow extends any>(sql: string, parameters?: any[]) => Promise<TRow[]>
  /**
   * Query then returns first row, if exists. `undefined` otherwise.
   */
  queryGetFirstRow: <TRow extends any>(sql: string, parameters?: any[]) => Promise<TRow>
}

/**
 * Options for the creation of an Entities instance.
 */
export type CreateEntitiesOptions = {
  /**
   * True to create and enable postgresql-related information and functionality respectively.
   *
   * If this is `false`, no SQL information and functionality will be present.
   */
  enablePostgreSql?: boolean
}

/**
 * An Entities instance with the loaded Data Formats and Relations.
 */
export type Entities<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  K extends RelationDeclarations<T> = RelationDeclarations<T>,
> = {
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
  sqldb: {
    /**
     * Drop a particular join table.
     */
    dropJoinTable: (relationName: ExtractRelationNamesOfManyToManyRelations<K>, db: DbService) => Promise<boolean>
    /**
     * Create a particular join table.
     */
    createJoinTable: (relationName: ExtractRelationNamesOfManyToManyRelations<K>, db: DbService) => Promise<boolean>
    /**
     * Drop all join tables.
     */
    dropJoinTables: (db: DbService) => Promise<boolean>
    /**
     * Create all join tables.
     */
    createJoinTables: (db: DbService) => Promise<boolean>
    /**
     * Create an entitiy DB store for the particular named entity.
     */
    createStore: <L extends T[number]['name']>(entityName: L, db: DbService) => Store<T, K, L>
  }
}
