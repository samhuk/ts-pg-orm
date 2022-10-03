import { DataFormats } from '../../../dataFormat/types'
import { Relation, RelationType } from '../../../relations/types'

export type OneToOneFromOneName<
  TDataFormats extends DataFormats,
  TRelation extends Relation<RelationType.ONE_TO_ONE>,
> = TRelation extends { relatedToOneRecordsName: string }
  ? TRelation['relatedToOneRecordsName']
  : TDataFormats[TRelation['toOneField']['dataFormat']]['name']

export type OneToOneToOneName<
  TDataFormats extends DataFormats,
  TRelation extends Relation<RelationType.ONE_TO_ONE>,
> = TRelation extends { relatedFromOneRecordsName: string }
  ? TRelation['relatedToOneRecordsName']
  : TDataFormats[TRelation['fromOneField']['dataFormat']]['name']

export type OneToManyFromOneName<
  TDataFormats extends DataFormats,
  TRelation extends Relation<RelationType.ONE_TO_MANY>,
> = TRelation extends { relatedToManyRecordsName: string }
  ? TRelation['relatedToManyRecordsName']
  : TDataFormats[TRelation['toManyField']['dataFormat']]['pluralizedName']

export type OneToManyToManyName<
  TDataFormats extends DataFormats,
  TRelation extends Relation<RelationType.ONE_TO_MANY>,
> = TRelation extends { relatedFromOneRecordsName: string }
  ? TRelation['relatedFromOneRecordsName']
  : TDataFormats[TRelation['fromOneField']['dataFormat']]['name']

export type ManyToManyFieldRef1Name<
  TDataFormats extends DataFormats,
  TRelation extends Relation<RelationType.MANY_TO_MANY>,
> = TRelation extends { relatedFieldRef2RecordsName: string }
  ? TRelation['relatedFieldRef2RecordsName']
  : TDataFormats[TRelation['fieldRef2']['dataFormat']]['pluralizedName']

export type ManyToManyFieldRef2Name<
  TDataFormats extends DataFormats,
  TRelation extends Relation<RelationType.MANY_TO_MANY>,
> = TRelation extends { relatedFieldRef1RecordsName: string }
  ? TRelation['relatedFieldRef1RecordsName']
  : TDataFormats[TRelation['fieldRef1']['dataFormat']]['pluralizedName']
