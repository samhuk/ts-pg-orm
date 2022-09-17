import { DataFilterNodeOrGroup } from '@samhuk/data-filter/dist/types'
import { DataQueryRecord } from '@samhuk/data-query/dist/types'
import { DataFormatDeclarations, DataFormatDeclaration, ToRecord } from '../../dataFormat/types'
import { ArrayTernary, ExpandRecursively, IsAny, PickAny } from '../../helpers/types'
import { RelationDeclarations, IsForeignFormatPluralFromRelation } from '../../relations/types'
import { RelatedDataPropertyNamesUnion } from '../types/relatedDataDicts'
import { RelatedDataPropertyNameToForeignDataFormatDict } from '../types/relatedDataPropNameToForeignDataFormatDict'
import { RelatedDataPropertyNameToRelationDict } from '../types/relatedDataPropNameToRelationDict.ts'

// For depth-limiting
type MaxDepth = 3
type Prev = [never, 0, 1, 2, 3]

export type AnyGetFunctionOptions<TIsPlural extends boolean = boolean> = GetFunctionOptions<
  DataFormatDeclarations,
  RelationDeclarations,
  DataFormatDeclaration,
  TIsPlural
>

export type GetFunctionOptions<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  K extends RelationDeclarations<T> = RelationDeclarations<T>,
  L extends T[number] = DataFormatDeclaration,
  TIsPlural extends boolean = boolean,
  D extends Prev[number] = MaxDepth
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
    TIsPlural extends true
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

export type AnyGetFunctionResult<TIsPlural extends boolean = boolean> = GetFunctionResult<
  DataFormatDeclarations,
  RelationDeclarations,
  DataFormatDeclaration,
  TIsPlural,
  GetFunctionOptions<DataFormatDeclarations, RelationDeclarations, DataFormatDeclaration, TIsPlural>
>

export type GetFunctionResultInternal<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  K extends RelationDeclarations<T> = RelationDeclarations<T>,
  L extends T[number] = DataFormatDeclaration,
  TIsPlural extends boolean = boolean,
  TOptions extends GetFunctionOptions<T, K, L, TIsPlural> = GetFunctionOptions<T, K, L, TIsPlural>,
  D extends Prev[number] = MaxDepth
> =
  ArrayTernary<
    ExpandRecursively<
      // this node
      (
        // If the fields property is present...
        TOptions extends { fields: string[] }
          // ...And if the fields[number] is any, then it's probably an empty array
          ? IsAny<TOptions['fields'][number]> extends true
            ? { } // So infer that as them wanting no fields of this node
            // else, it's probably a populated array (at least one field within)
            : PickAny<ToRecord<L>, TOptions['fields'][number]>
          // Else (fields property is not present), then default to the full record
          : ToRecord<L>
      )
      // child nodes
      & (
        TOptions extends { relations: any }
          ? {
            [TRelatedDataPropertyName in keyof TOptions['relations']]:
              GetFunctionResultInternal<
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

export type GetFunctionResult<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  K extends RelationDeclarations<T> = RelationDeclarations<T>,
  L extends T[number] = DataFormatDeclaration,
  TIsPlural extends boolean = boolean,
  TOptions extends GetFunctionOptions<T, K, L, TIsPlural> = GetFunctionOptions<T, K, L, TIsPlural>,
  D extends Prev[number] = MaxDepth
> = ExpandRecursively<GetFunctionResultInternal<T, K, L, TIsPlural, TOptions, D>>

export type GetSingleFunction<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  K extends RelationDeclarations<T> = RelationDeclarations<T>,
  L extends T[number] = DataFormatDeclaration,
> = <TGetFunctionOptions extends GetFunctionOptions<T, K, L, false>>(
  options: TGetFunctionOptions,
) => Promise<GetFunctionResult<T, K, L, false, TGetFunctionOptions>>

export type GetMultipleFunction<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number],
> = <TGetFunctionOptions extends GetFunctionOptions<T, K, L, true>>(
  options: TGetFunctionOptions,
) => Promise<GetFunctionResult<T, K, L, true, TGetFunctionOptions>>
