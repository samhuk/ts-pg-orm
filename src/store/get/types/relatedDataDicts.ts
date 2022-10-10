import { DataFormats } from '../../../dataFormat/types'
import { StringKeysOf } from '../../../helpers/types'
import { Relation, Relations } from '../../../relations/types'
import {
  ExtractRelevantRelationsWithManyToManyFieldRef1,
  ExtractRelevantRelationsWithManyToManyFieldRef2,
  ExtractRelevantRelationsWithOneToManyFromOne,
  ExtractRelevantRelationsWithOneToManyToMany,
  ExtractRelevantRelationsWithOneToOneFromOne,
  ExtractRelevantRelationsWithOneToOneToOne,
  RelationToForeignRecord,
} from '../../../relations/types/relationExtraction'

import {
  ManyToManyFieldRef1Name,
  ManyToManyFieldRef2Name,
  OneToManyFromOneName,
  OneToManyToManyName,
  OneToOneFromOneName,
  OneToOneToOneName,
} from './relatedDataPropNames'

export type OneToOneFromOneDict<
  TDataFormats extends DataFormats,
  TRelations extends Relations,
  TDataFormatName extends string,
> = {
  [TRelation in ExtractRelevantRelationsWithOneToOneFromOne<TRelations, TDataFormatName> as
    TRelation extends Relation
      ? OneToOneFromOneName<TDataFormats, TRelation>
      : never
  ]: RelationToForeignRecord<TDataFormats, TRelation & Relation, TDataFormatName>
}

export type OneToOneToOneDict<
  TDataFormats extends DataFormats,
  TRelations extends Relations,
  TDataFormatName extends string,
> = {
  [TRelation in ExtractRelevantRelationsWithOneToOneToOne<TRelations, TDataFormatName> as
    TRelation extends Relation
      ? OneToOneToOneName<TDataFormats, TRelation>
      : never
  ]: RelationToForeignRecord<TDataFormats, TRelation & Relation, TDataFormatName>
}

export type OneToManyFromOneDict<
  TDataFormats extends DataFormats,
  TRelations extends Relations,
  TDataFormatName extends string,
> = {
  [TRelation in ExtractRelevantRelationsWithOneToManyFromOne<TRelations, TDataFormatName> as
    TRelation extends Relation
      ? OneToManyFromOneName<TDataFormats, TRelation>
      : never
  ]: RelationToForeignRecord<TDataFormats, TRelation & Relation, TDataFormatName>[]
}

export type OneToManyToManyDict<
  TDataFormats extends DataFormats,
  TRelations extends Relations,
  TDataFormatName extends string,
> = {
  [TRelation in ExtractRelevantRelationsWithOneToManyToMany<TRelations, TDataFormatName> as
    TRelation extends Relation
      ? OneToManyToManyName<TDataFormats, TRelation>
      : never
  ]: RelationToForeignRecord<TDataFormats, TRelation & Relation, TDataFormatName>
}

export type ManyToManyFieldRef1Dict<
  TDataFormats extends DataFormats,
  TRelations extends Relations,
  TDataFormatName extends string,
> = {
  [TRelation in ExtractRelevantRelationsWithManyToManyFieldRef1<TRelations, TDataFormatName> as
    TRelation extends Relation
      ? ManyToManyFieldRef1Name<TDataFormats, TRelation>
      : never
  ]: RelationToForeignRecord<TDataFormats, TRelation & Relation, TDataFormatName>[]
}

export type ManyToManyFieldRef2Dict<
  TDataFormats extends DataFormats,
  TRelations extends Relations,
  TDataFormatName extends string,
> = {
  [TRelation in ExtractRelevantRelationsWithManyToManyFieldRef2<TRelations, TDataFormatName> as
    TRelation extends Relation
      ? ManyToManyFieldRef2Name<TDataFormats, TRelation>
      : never
  ]: RelationToForeignRecord<TDataFormats, TRelation & Relation, TDataFormatName>[]
}

/**
 * The dict that maps a related data property name to the related data
 * record or list of records.
 */
export type RelatedDataDict<
  TDataFormats extends DataFormats,
  TRelations extends Relations,
  TDataFormatName extends string,
> = OneToOneFromOneDict<TDataFormats, TRelations, TDataFormatName>
  & OneToOneToOneDict<TDataFormats, TRelations, TDataFormatName>
  & OneToManyFromOneDict<TDataFormats, TRelations, TDataFormatName>
  & OneToManyToManyDict<TDataFormats, TRelations, TDataFormatName>
  & ManyToManyFieldRef1Dict<TDataFormats, TRelations, TDataFormatName>
  & ManyToManyFieldRef2Dict<TDataFormats, TRelations, TDataFormatName>

/**
 * All of the possible related data property names for a particular DFD.
 */
export type RelatedDataPropertyNamesUnion<
  TDataFormats extends DataFormats,
  TRelations extends Relations,
  TDataFormatName extends string,
> = StringKeysOf<OneToOneFromOneDict<TDataFormats, TRelations, TDataFormatName>>
  | StringKeysOf<OneToOneToOneDict<TDataFormats, TRelations, TDataFormatName>>
  | StringKeysOf<OneToManyFromOneDict<TDataFormats, TRelations, TDataFormatName>>
  | StringKeysOf<OneToManyToManyDict<TDataFormats, TRelations, TDataFormatName>>
  | StringKeysOf<ManyToManyFieldRef1Dict<TDataFormats, TRelations, TDataFormatName>>
  | StringKeysOf<ManyToManyFieldRef2Dict<TDataFormats, TRelations, TDataFormatName>>
