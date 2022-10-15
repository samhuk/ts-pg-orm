import { Access, ArrayTernary, Cast, ExpandRecursivelyWithAdditionalLeafNodes, IsAny, PickAny } from '../../../helpers/types'
import { Relations, Relation } from '../../../relations/types'
import { IsForeignFormatPluralFromRelation } from '../../../relations/types/relationExtraction'
import { DataFormats, DataFormat, ToRecord } from '../../../types'
import { MaxDepth, Prev } from './depth'
import { GetFunctionOptions } from './getFunctionOptions'
import { RelatedDataPropertyNameToForeignDataFormatDict } from './relatedDataPropNameToForeignDataFormatDict'
import { RelatedDataPropertyNameToRelationDict } from './relatedDataPropNameToRelationDict.ts'

type GetFunctionResultThisNodeInclusionary<
  TDataFormats extends DataFormats = DataFormats,
  TRelations extends Relations = Relations,
  TLocalDataFormat extends DataFormat = DataFormat,
  TIsPlural extends boolean = boolean,
  TOptions extends GetFunctionOptions<TDataFormats, TRelations, TLocalDataFormat, TIsPlural> =
    GetFunctionOptions<TDataFormats, TRelations, TLocalDataFormat, TIsPlural>,
> =
  // If the fields property is present...
  TOptions extends { fields: string[] }
  // ...And if the fields[number] is any, then it's an empty array...
  ? IsAny<TOptions['fields'][number]> extends true
    ? { } // ...So infer that as them wanting no fields
    // Else, it's a populated array (at least one field within)
    : PickAny<ToRecord<TLocalDataFormat>, TOptions['fields'][number]>
  // Else (fields property is not present), then default to the full record
  : ToRecord<TLocalDataFormat>

type GetFunctionResultThisNodeExclusionary<
  TDataFormats extends DataFormats = DataFormats,
  TRelations extends Relations = Relations,
  TLocalDataFormat extends DataFormat = DataFormat,
  TIsPlural extends boolean = boolean,
  TOptions extends GetFunctionOptions<TDataFormats, TRelations, TLocalDataFormat, TIsPlural> =
    GetFunctionOptions<TDataFormats, TRelations, TLocalDataFormat, TIsPlural>,
> =
  // If the fields property is present...
  TOptions extends { fields: string[] }
  // ...And if the fields[number] is any, then it's an empty array...
  ? IsAny<TOptions['fields'][number]> extends true
    // ...So infer that as them wanting no fields excluded
    ? ToRecord<TLocalDataFormat>
    // Else, it's a populated array (at least one field within)
    : Omit<ToRecord<TLocalDataFormat>, TOptions['fields'][number]>
  // Else (fields property is not present), then default to the full record
  : ToRecord<TLocalDataFormat>

  type GetFunctionResultThisNode<
  TDataFormats extends DataFormats = DataFormats,
  TRelations extends Relations = Relations,
  TLocalDataFormat extends DataFormat = DataFormat,
  TIsPlural extends boolean = boolean,
  TOptions extends GetFunctionOptions<TDataFormats, TRelations, TLocalDataFormat, TIsPlural> =
    GetFunctionOptions<TDataFormats, TRelations, TLocalDataFormat, TIsPlural>,
> =
  TOptions extends { excludeFields: boolean }
    ? TOptions['excludeFields'] extends true
      ? GetFunctionResultThisNodeExclusionary<TDataFormats, TRelations, TLocalDataFormat, TIsPlural, TOptions>
      : GetFunctionResultThisNodeInclusionary<TDataFormats, TRelations, TLocalDataFormat, TIsPlural, TOptions>
    : GetFunctionResultThisNodeInclusionary<TDataFormats, TRelations, TLocalDataFormat, TIsPlural, TOptions>

type _GetFunctionResult<
  TDataFormats extends DataFormats = DataFormats,
  TRelations extends Relations = Relations,
  TLocalDataFormat extends DataFormat = DataFormat,
  TIsPlural extends boolean = boolean,
  TOptions extends GetFunctionOptions<TDataFormats, TRelations, TLocalDataFormat, TIsPlural> =
    GetFunctionOptions<TDataFormats, TRelations, TLocalDataFormat, TIsPlural>,
  D extends Prev[number] = MaxDepth
> =
  ArrayTernary<
    // This node
    GetFunctionResultThisNode<TDataFormats, TRelations, TLocalDataFormat, TIsPlural, TOptions>
    // Child nodes
    & (TOptions extends { relations: any }
      ? {
        [TRelatedDataPropertyName in keyof TOptions['relations']]:
          _GetFunctionResult<
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
                Access<
                  RelatedDataPropertyNameToRelationDict<TDataFormats, TRelations, TLocalDataFormat['name']>, TRelatedDataPropertyName
                >,
                Relation
              >,
              TLocalDataFormat['name']
            >,
            TOptions['relations'][TRelatedDataPropertyName],
            Prev[D]
          >
        }
      : { }
    ),
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
> = ExpandRecursivelyWithAdditionalLeafNodes<_GetFunctionResult<TDataFormats, TRelations, TLocalDataFormat, TIsPlural, TOptions, D>, Date>

export type AnyGetFunctionResult<TIsPlural extends boolean = boolean> = GetFunctionResult<
  DataFormats,
  Relations,
  DataFormat,
  TIsPlural,
  GetFunctionOptions<DataFormats, Relations, DataFormat, TIsPlural>
>
