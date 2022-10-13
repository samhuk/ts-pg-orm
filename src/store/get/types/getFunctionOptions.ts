import { DataFilterNodeOrGroup } from '@samhuk/data-filter/dist/types'
import { DataQueryRecord } from '@samhuk/data-query/dist/types'
import { Cast, Access, ValuesUnionFromDict } from '../../../helpers/types'
import { Relations, Relation } from '../../../relations/types'
import { IsForeignFormatPluralFromRelation } from '../../../relations/types/relationExtraction'
import { DataFormats, DataFormat } from '../../../types'
import { Prev, MaxDepth } from './depth'
import { RelatedDataPropertyNamesUnion } from './relatedDataDicts'
import { RelatedDataPropertyNameToForeignDataFormatDict } from './relatedDataPropNameToForeignDataFormatDict'
import { RelatedDataPropertyNameToRelationDict } from './relatedDataPropNameToRelationDict.ts'

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
     *
     * Note that if `excludeFields` is `true`, these become the fields to *exclude*.
     */
    fields?: TLocalDataFormat['fieldNameList'][number][]
    /**
     * Determines whether the supplied `fields` are inclusionary or exclusionary.
     *
     * This can be useful if almost all fields should be included.
     *
     * @default false
     */
    excludeFields?: boolean
    /**
     * Child relations to include.
     */
    relations?: {
      [TRelatedDataPropertyName in RelatedDataPropertyNamesUnion<TDataFormats, TRelations, TLocalDataFormat['name']>]?:
        GetFunctionOptions<
          TDataFormats,
          TRelations,
          Cast<
            Access<
              RelatedDataPropertyNameToForeignDataFormatDict<TDataFormats, TRelations, TLocalDataFormat['name']>, TRelatedDataPropertyName
            >,
            DataFormat
          >,
          IsForeignFormatPluralFromRelation<
            Cast<
              Access<RelatedDataPropertyNameToRelationDict<TDataFormats, TRelations, TLocalDataFormat['name']>, TRelatedDataPropertyName>,
              Relation
            >,
            TLocalDataFormat['name']
          >,
          Prev[D]
        >
    }
  } & (TIsPlural extends true
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
