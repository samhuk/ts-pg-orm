import { Relation, RelationOptions, RelationType } from '.'
import { DataFormat, DataFormats } from '../../dataFormat/types'

type _RelationOptionsToName<
  TLeftDataFormat extends DataFormat,
  TLeftFieldName extends string,
  TRightDataFormat extends DataFormat,
  TRightFieldName extends string,
> = `${TLeftDataFormat['name']}${Capitalize<TLeftFieldName>}To${TRightDataFormat['capitalizedName']}${Capitalize<TRightFieldName>}`

export type RelationOptionsToName<TRelationOptions extends RelationOptions, TDataFormats extends DataFormats> = {
  [RelationType.ONE_TO_ONE]: TRelationOptions extends RelationOptions<RelationType.ONE_TO_ONE>
    ? _RelationOptionsToName<
      TDataFormats[TRelationOptions['fromOneField']['dataFormat']],
      TRelationOptions['fromOneField']['field'],
      TDataFormats[TRelationOptions['toOneField']['dataFormat']],
      TRelationOptions['toOneField']['field']
    >
    : never
  [RelationType.ONE_TO_MANY]: TRelationOptions extends RelationOptions<RelationType.ONE_TO_MANY>
    ? _RelationOptionsToName<
    TDataFormats[TRelationOptions['fromOneField']['dataFormat']],
      TRelationOptions['fromOneField']['field'],
      TDataFormats[TRelationOptions['toManyField']['dataFormat']],
      TRelationOptions['toManyField']['field']
    >
    : never
  [RelationType.MANY_TO_MANY]: TRelationOptions extends RelationOptions<RelationType.MANY_TO_MANY>
    ? _RelationOptionsToName<
      TDataFormats[TRelationOptions['fieldRef1']['dataFormat']],
      TRelationOptions['fieldRef1']['field'],
      TDataFormats[TRelationOptions['fieldRef2']['dataFormat']],
      TRelationOptions['fieldRef2']['field']
    >
    : never
}[TRelationOptions['type']]

export type RelationToName<TRelation extends Relation, TDataFormats extends DataFormats> = RelationOptionsToName<TRelation, TDataFormats>
