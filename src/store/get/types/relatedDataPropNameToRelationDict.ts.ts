import { DataFormats } from '../../../dataFormat/types'
import {
  Relation,
  Relations, RelationType,
} from '../../../relations/types'
import {
  ExtractRelevantRelationsWithManyToManyFieldRef1,
  ExtractRelevantRelationsWithManyToManyFieldRef2,
  ExtractRelevantRelationsWithOneToManyFromOne,
  ExtractRelevantRelationsWithOneToManyToMany,
  ExtractRelevantRelationsWithOneToOneFromOne,
  ExtractRelevantRelationsWithOneToOneToOne,
} from '../../../relations/types/relationExtraction'

import { RelatedDataPropertyNamesUnion } from './relatedDataDicts'
import {
  ManyToManyFieldRef1Name,
  ManyToManyFieldRef2Name,
  OneToManyFromOneName,
  OneToManyToManyName,
  OneToOneFromOneName,
  OneToOneToOneName,
} from './relatedDataPropNames'

type OneToOneFromOneDict<
  TDataFormats extends DataFormats,
  TRelations extends Relations,
  TLocalDataFormatName extends string,
> = {
  [TRelation in ExtractRelevantRelationsWithOneToOneFromOne<TRelations, TLocalDataFormatName> as
    OneToOneFromOneName<TDataFormats, TRelation & Relation<RelationType.ONE_TO_ONE>>
  ]: TRelation
}

type OneToOneToOneDict<
  TDataFormats extends DataFormats,
  TRelations extends Relations,
  TLocalDataFormatName extends string,
> = {
  [TRelation in ExtractRelevantRelationsWithOneToOneToOne<TRelations, TLocalDataFormatName> as
    OneToOneToOneName<TDataFormats, TRelation & Relation<RelationType.ONE_TO_ONE>>
  ]: TRelation
}

type OneToManyFromOneDict<
  TDataFormats extends DataFormats,
  TRelations extends Relations,
  TLocalDataFormatName extends string,
> = {
  [TRelation in ExtractRelevantRelationsWithOneToManyFromOne<TRelations, TLocalDataFormatName> as
    OneToManyFromOneName<TDataFormats, TRelation & Relation<RelationType.ONE_TO_MANY>>
  ]: TRelation
}

type OneToManyToManyDict<
  TDataFormats extends DataFormats,
  TRelations extends Relations,
  TLocalDataFormatName extends string,
> = {
  [TRelation in ExtractRelevantRelationsWithOneToManyToMany<TRelations, TLocalDataFormatName> as
    OneToManyToManyName<TDataFormats, TRelation & Relation<RelationType.ONE_TO_MANY>>
  ]: TRelation
}

type ManyToManyFieldRef1Dict<
  TDataFormats extends DataFormats,
  TRelations extends Relations,
  TLocalDataFormatName extends string,
> = {
  [TRelation in ExtractRelevantRelationsWithManyToManyFieldRef1<TRelations, TLocalDataFormatName> as
    ManyToManyFieldRef1Name<TDataFormats, TRelation & Relation<RelationType.MANY_TO_MANY>>
  ]: TRelation
}

type ManyToManyFieldRef2Dict<
  TDataFormats extends DataFormats,
  TRelations extends Relations,
  TLocalDataFormatName extends string,
> = {
  [TRelation in ExtractRelevantRelationsWithManyToManyFieldRef2<TRelations, TLocalDataFormatName> as
    ManyToManyFieldRef2Name<TDataFormats, TRelation & Relation<RelationType.MANY_TO_MANY>>
  ]: TRelation
}

/**
 * The dict that maps a related data property name to the relation
 */
export type RelatedDataPropertyNameToRelationDict<
  TDataFormats extends DataFormats,
  TRelations extends Relations,
  TLocalDataFormatName extends string,
> = OneToOneFromOneDict<TDataFormats, TRelations, TLocalDataFormatName>
  & OneToOneToOneDict<TDataFormats, TRelations, TLocalDataFormatName>
  & OneToManyFromOneDict<TDataFormats, TRelations, TLocalDataFormatName>
  & OneToManyToManyDict<TDataFormats, TRelations, TLocalDataFormatName>
  & ManyToManyFieldRef1Dict<TDataFormats, TRelations, TLocalDataFormatName>
  & ManyToManyFieldRef2Dict<TDataFormats, TRelations, TLocalDataFormatName>

export type GetRelationOfRelatedDataPropertyName<
  TDataFormats extends DataFormats,
  TRelations extends Relations,
  TLocalDataFormatName extends string,
  TRelatedDataPropName extends RelatedDataPropertyNamesUnion<TDataFormats, TRelations, TLocalDataFormatName>,
> = RelatedDataPropertyNameToRelationDict<TDataFormats, TRelations, TLocalDataFormatName>[
  TRelatedDataPropName & keyof RelatedDataPropertyNameToRelationDict<TDataFormats, TRelations, TLocalDataFormatName>
]
