import { DataFilterNodeOrGroup } from '@samhuk/data-filter/dist/types'
import { DataQueryRecord } from '@samhuk/data-query/dist/types'
import { ArrayTernary, ExpandRecursively, IsAny, PickAny, ValuesUnionFromDict } from '../../../../helpers/types'
import { DataFormat, DataFormats } from '../../../dataFormat/types'
import { ToRecord } from '../../../dataFormat/types/record'
import { Relations } from '../../../relations/types'
import { IsForeignFormatPluralFromRelation } from '../../../relations/types/relationExtraction'
import { RelatedDataPropertyNamesUnion } from './relatedDataDicts'
import { RelatedDataPropertyNameToForeignDataFormatDict } from './relatedDataPropNameToForeignDataFormatDict'
import { RelatedDataPropertyNameToRelationDict } from './relatedDataPropNameToRelationDict.ts'

// For depth-limiting
type MaxDepth = 3
type Prev = [never, 0, 1, 2, 3]

export type AnyGetFunctionOptions<TIsPlural extends boolean = boolean> = GetFunctionOptions<
  DataFormats,
  Relations,
  DataFormat,
  TIsPlural
>

export type GetFunctionOptions<
  TDataFormats extends DataFormats = DataFormats,
  TRelations extends Relations = Relations,
  TLocalDataFormat extends DataFormat = DataFormat,
  TIsPlural extends boolean = boolean,
  D extends Prev[number] = MaxDepth
> = [D] extends [never] ? never : (
  {
    /**
     * The fields of the data format to include.
     */
    fields?: TLocalDataFormat['fieldNameList'][number][]
    /**
     * Child relations to include.
     */
    relations?: {
      [TRelatedDataPropertyName in RelatedDataPropertyNamesUnion<TDataFormats, TRelations, TLocalDataFormat['name']>]?:
        GetFunctionOptions<
          TDataFormats,
          TRelations,
          // @ts-ignore
          RelatedDataPropertyNameToForeignDataFormatDict<TDataFormats, TRelations, TLocalDataFormat['name']>[TRelatedDataPropertyName],
          IsForeignFormatPluralFromRelation<
            // @ts-ignore
            RelatedDataPropertyNameToRelationDict<TDataFormats, TRelations, TLocalDataFormat['name']>[TRelatedDataPropertyName],
            TLocalDataFormat['name']
          >,
          Prev[D]
        >
    }
  } & (
    TIsPlural extends true
      /**
       * Query to use to select the records.
       */
      ? { query?: DataQueryRecord<ValuesUnionFromDict<TLocalDataFormat['fields']>['name']> }
      /**
       * Filter to use to select the record.
       */
      : { filter?: DataFilterNodeOrGroup<ValuesUnionFromDict<TLocalDataFormat['fields']>['name']> }
  )
)

export type AnyGetFunctionResult<TIsPlural extends boolean = boolean> = GetFunctionResult<
  DataFormats,
  Relations,
  DataFormat,
  TIsPlural,
  GetFunctionOptions<DataFormats, Relations, DataFormat, TIsPlural>
>

export type GetFunctionResultInternal<
  TDataFormats extends DataFormats = DataFormats,
  TRelations extends Relations = Relations,
  TLocalDataFormat extends DataFormat = DataFormat,
  TIsPlural extends boolean = boolean,
  TOptions extends GetFunctionOptions<TDataFormats, TRelations, TLocalDataFormat, TIsPlural> =
    GetFunctionOptions<TDataFormats, TRelations, TLocalDataFormat, TIsPlural>,
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
            : PickAny<ToRecord<TLocalDataFormat['fields']>, TOptions['fields'][number]>
          // Else (fields property is not present), then default to the full record
          : ToRecord<TLocalDataFormat['fields']>
      )
      // child nodes
      & (
        TOptions extends { relations: any }
          ? {
            [TRelatedDataPropertyName in keyof TOptions['relations']]:
              GetFunctionResultInternal<
                TDataFormats,
                TRelations,
                // @ts-ignore
                RelatedDataPropertyNameToForeignDataFormatDict<TDataFormats, TRelations, TLocalDataFormat['name']>[TRelatedDataPropertyName],
                IsForeignFormatPluralFromRelation<
                  // @ts-ignore
                  RelatedDataPropertyNameToRelationDict<TDataFormats, TRelations, TLocalDataFormat['name']>[TRelatedDataPropertyName],
                  TLocalDataFormat['name']
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
  TDataFormats extends DataFormats = DataFormats,
  TRelations extends Relations = Relations,
  TLocalDataFormat extends DataFormat = DataFormat,
  TIsPlural extends boolean = boolean,
  TOptions extends GetFunctionOptions<TDataFormats, TRelations, TLocalDataFormat, TIsPlural> =
    GetFunctionOptions<TDataFormats, TRelations, TLocalDataFormat, TIsPlural>,
  D extends Prev[number] = MaxDepth
> = ExpandRecursively<GetFunctionResultInternal<TDataFormats, TRelations, TLocalDataFormat, TIsPlural, TOptions, D>>

export type GetSingleFunction<
  TDataFormats extends DataFormats,
  TRelations extends Relations = Relations,
  TLocalDataFormat extends DataFormat = DataFormat,
> = <TGetFunctionOptions extends GetFunctionOptions<TDataFormats, TRelations, TLocalDataFormat, false>>(
  options: TGetFunctionOptions,
) => Promise<GetFunctionResult<TDataFormats, TRelations, TLocalDataFormat, false, TGetFunctionOptions>>

export type GetMultipleFunction<
  TDataFormats extends DataFormats,
  TRelations extends Relations = Relations,
  TLocalDataFormat extends DataFormat = DataFormat,
> = <TGetFunctionOptions extends GetFunctionOptions<TDataFormats, TRelations, TLocalDataFormat, true>>(
  options: TGetFunctionOptions,
) => Promise<GetFunctionResult<TDataFormats, TRelations, TLocalDataFormat, true, TGetFunctionOptions>>
