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
  query: <TRow extends any>(sql: string, parameters?: any[]) => Promise<DbServiceQueryResult<TRow>>
  queryGetRows: <TRow extends any>(sql: string, parameters?: any[]) => Promise<TRow[]>
  queryGetFirstRow: <TRow extends any>(sql: string, parameters?: any[]) => Promise<TRow>
}

/**
 * Options for the creation of an Entities instance.
 */
export type CreateEntitiesOptions = {
  enablePostgreSql?: boolean
}

/**
 * An Entities instance, containing the original data format and relation declarations, and enriched
 * information about them.
 */
export type Entities<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  K extends RelationDeclarations<T> = RelationDeclarations<T>,
> = {
  dataFormats: DataFormatsDict<T>
  relations: RelationsDict<T, K>
  dataFormatDeclarations: T,
  relationDeclarations: K
  sqldb: {
    dropJoinTable: (relationName: ExtractRelationNamesOfManyToManyRelations<K>, db: DbService) => Promise<boolean>
    createJoinTable: (relationName: ExtractRelationNamesOfManyToManyRelations<K>, db: DbService) => Promise<boolean>
    dropJoinTables: (db: DbService) => Promise<boolean>
    createJoinTables: (db: DbService) => Promise<boolean>
    createEntityDbStore: <L extends T[number]['name']>(entityName: L, db: DbService) => Store<T, K, L>
  }
}
