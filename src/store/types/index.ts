import { DataFilterNodeOrGroup } from '@samhuk/data-filter/dist/types'
import { DataQueryRecord } from '@samhuk/data-query/dist/types'
import { CreateRecordOptions, DataFormatDeclaration, DataFormatDeclarations, ManualCreateRecordOptions, ToRecord } from '../../dataFormat/types'
import { ExpandRecursively, PickAny } from '../../helpers/types'
import { IsForeignFormatPluralFromRelation, RelationDeclarations } from '../../relations/types'
import { RelatedDataPropertyNamesUnion } from './relatedDataDicts'
import { RelatedDataPropertyNameToForeignDataFormatDict } from './relatedDataPropNameToForeignDataFormatDict'
import { RelatedDataPropertyNameToRelationDict } from './relatedDataPropNameToRelationDict.ts'

// For depth-limiting
type Prev = [never, 0, 1, 2]

export type AnyGetFunctionOptions<TIsPlural extends 0 | 1 = 0> = GetFunctionOptions<
  DataFormatDeclarations,
  RelationDeclarations,
  DataFormatDeclaration,
  TIsPlural
>

export type GetFunctionOptions<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  K extends RelationDeclarations<T> = RelationDeclarations<T>,
  L extends T[number] = DataFormatDeclaration,
  TIsPlural extends 0 | 1 = 0,
  D extends Prev[number] = 2
> = [D] extends [never] ? never : (
  {
    /**
     * The fields of the data format to include.
     */
    fields?: L['fields'][number]['name'][]
    /**
     * Child relations to include.
     */
    relations?: {
      [TRelatedDataPropertyName in RelatedDataPropertyNamesUnion<T, K, L['name']>]?:
        GetFunctionOptions<
          T,
          K,
          // @ts-ignore
          RelatedDataPropertyNameToForeignDataFormatDict<T, K, L['name']>[TRelatedDataPropertyName],
          IsForeignFormatPluralFromRelation<
            // @ts-ignore
            RelatedDataPropertyNameToRelationDict<T, K, L['name']>[TRelatedDataPropertyName],
            L['name']
          >,
          Prev[D]
        >
    }
  } & (
    TIsPlural extends 1
      /**
       * Query to use to select the records.
       */
      ? { query?: DataQueryRecord<L['fields'][number]['name']> }
      /**
       * Filter to use to select the record.
       */
      : { filter?: DataFilterNodeOrGroup<L['fields'][number]['name']> }
  )
)

type ArrayTernary<T, TIsArray extends 0 | 1> = TIsArray extends 0 ? T : T[]

export type AnyGetFunctionResult<TIsPlural extends 0 | 1 = 0> = GetFunctionResult<
  DataFormatDeclarations,
  RelationDeclarations,
  DataFormatDeclaration,
  TIsPlural,
  GetFunctionOptions<DataFormatDeclarations, RelationDeclarations, DataFormatDeclaration, TIsPlural>
>

export type GetFunctionResult<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  K extends RelationDeclarations<T> = RelationDeclarations<T>,
  L extends T[number] = DataFormatDeclaration,
  TIsPlural extends 0 | 1 = 0,
  TOptions extends GetFunctionOptions<T, K, L, TIsPlural> = GetFunctionOptions<T, K, L, TIsPlural>,
  D extends Prev[number] = 2
> =
  ArrayTernary<
    ExpandRecursively<
      // this node
      (
        TOptions extends { fields: string[] } ? PickAny<ToRecord<L>, TOptions['fields'][number]> : ToRecord<L>
      )
      // child nodes
      & (
        TOptions extends { relations: any }
          ? {
            [TRelatedDataPropertyName in keyof TOptions['relations']]:
              GetFunctionResult<
                T,
                K,
                // @ts-ignore
                RelatedDataPropertyNameToForeignDataFormatDict<T, K, L['name']>[TRelatedDataPropertyName],
                IsForeignFormatPluralFromRelation<
                  // @ts-ignore
                  RelatedDataPropertyNameToRelationDict<T, K, L['name']>[TRelatedDataPropertyName],
                  L['name']
                >,
                TOptions['relations'][TRelatedDataPropertyName],
                Prev[D]
              >
            }
          : { }
      )
    >,
    TIsPlural
  >

export type GetSingleFunction<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  K extends RelationDeclarations<T> = RelationDeclarations<T>,
  L extends T[number] = DataFormatDeclaration,
> = <TGetFunctionOptions extends GetFunctionOptions<T, K, L>>(
  options: TGetFunctionOptions,
) => Promise<GetFunctionResult<T, K, L, 0, TGetFunctionOptions>>

export type GetMultipleFunction<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number],
> = <TGetFunctionOptions extends GetFunctionOptions<T, K, L, 1>>(
  options: TGetFunctionOptions,
) => Promise<GetFunctionResult<T, K, L, 1, TGetFunctionOptions>>

export type UpdateSingleFunctionOptions<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  K extends RelationDeclarations<T> = RelationDeclarations<T>,
  L extends T[number] = T[number],
> = {
  /**
   * The fields to update with their new values.
   */
  record: Partial<ToRecord<L>>
  /**
   * Filter to select the single record to update.
   */
  filter: DataFilterNodeOrGroup<L['fields'][number]['name']>
  /**
   * Determines whether the updated record is returned
   */
  return?: boolean
}

export type UpdateSingleFunctionResult<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  K extends RelationDeclarations<T> = RelationDeclarations<T>,
  L extends T[number] = T[number],
  TOptions extends UpdateSingleFunctionOptions<T, K, L> = UpdateSingleFunctionOptions<T, K, L>,
> = TOptions extends { return: boolean }
? TOptions['return'] extends true
  ? ToRecord<L> | null
  : boolean
: ToRecord<L> | null

type UpdateSingleFunction<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number],
> = <TOptions extends UpdateSingleFunctionOptions<T, K, L>>(
  options: TOptions,
) => UpdateSingleFunctionResult<T, K, L, TOptions>

export type Store<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  /**
   * Creates the table for the store.
   */
  provision: () => Promise<void>
  /**
   * Drops the table for the store.
   */
  unprovision: () => Promise<void>
  /**
   * Adds a new record, excluding auto-generated fields.
   */
  create: (options: CreateRecordOptions<Extract<T[number], { name: L }>>) => Promise<ToRecord<Extract<T[number], { name: L }>>>
  /**
   * Adds a new record, including auto-generated fields.
   */
  createManual: (options: ManualCreateRecordOptions<Extract<T[number], { name: L }>>) => Promise<ToRecord<Extract<T[number], { name: L }>>>
  /**
   * Retreives a single record, optionally including related data.
   */
  getSingle: GetSingleFunction<T, K, Extract<T[number], { name: L }>>
  /**
   * Retreives multiple records, optionally including related data.
   */
  getMultiple: GetMultipleFunction<T, K, Extract<T[number], { name: L }>>
  /**
   * Updates a single record.
   */
  updateSingle: UpdateSingleFunction<T, K, Extract<T[number], { name: L }>>
}
