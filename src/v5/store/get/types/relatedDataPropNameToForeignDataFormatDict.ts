import { DataFormats } from '../../../dataFormat/types'
import { Relation, Relations } from '../../../relations/types'
import {
  ExtractRelevantRelationsWithManyToManyFieldRef1,
  ExtractRelevantRelationsWithManyToManyFieldRef2,
  ExtractRelevantRelationsWithOneToManyFromOne,
  ExtractRelevantRelationsWithOneToManyToMany,
  ExtractRelevantRelationsWithOneToOneFromOne,
  ExtractRelevantRelationsWithOneToOneToOne,
  RelationToForeignDataFormat,
} from '../../../relations/types/relationExtraction'
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
    TRelation extends Relation
      ? OneToOneFromOneName<TDataFormats, TRelation>
      : never
  ]: RelationToForeignDataFormat<TDataFormats, TRelation & Relation, TLocalDataFormatName>
}

type OneToOneToOneDict<
  TDataFormats extends DataFormats,
  TRelations extends Relations,
  TLocalDataFormatName extends string,
> = {
  [TRelation in ExtractRelevantRelationsWithOneToOneToOne<TRelations, TLocalDataFormatName> as
    TRelation extends Relation
      ? OneToOneToOneName<TDataFormats, TRelation>
      : never
  ]: RelationToForeignDataFormat<TDataFormats, TRelation & Relation, TLocalDataFormatName>
}

type OneToManyFromOneDict<
  TDataFormats extends DataFormats,
  TRelations extends Relations,
  TLocalDataFormatName extends string,
> = {
  [TRelation in ExtractRelevantRelationsWithOneToManyFromOne<TRelations, TLocalDataFormatName> as
    TRelation extends Relation
      ? OneToManyFromOneName<TDataFormats, TRelation>
      : never
  ]: RelationToForeignDataFormat<TDataFormats, TRelation & Relation, TLocalDataFormatName>
}

type OneToManyToManyDict<
  TDataFormats extends DataFormats,
  TRelations extends Relations,
  TLocalDataFormatName extends string,
> = {
  [TRelation in ExtractRelevantRelationsWithOneToManyToMany<TRelations, TLocalDataFormatName> as
    TRelation extends Relation
      ? OneToManyToManyName<TDataFormats, TRelation>
      : never
  ]: RelationToForeignDataFormat<TDataFormats, TRelation & Relation, TLocalDataFormatName>
}

type ManyToManyFieldRef1Dict<
  TDataFormats extends DataFormats,
  TRelations extends Relations,
  TLocalDataFormatName extends string,
> = {
  [TRelation in ExtractRelevantRelationsWithManyToManyFieldRef1<TRelations, TLocalDataFormatName> as
    TRelation extends Relation
      ? ManyToManyFieldRef1Name<TDataFormats, TRelation>
      : never
  ]: RelationToForeignDataFormat<TDataFormats, TRelation & Relation, TLocalDataFormatName>
}

type ManyToManyFieldRef2Dict<
  TDataFormats extends DataFormats,
  TRelations extends Relations,
  TLocalDataFormatName extends string,
> = {
  [TRelation in ExtractRelevantRelationsWithManyToManyFieldRef2<TRelations, TLocalDataFormatName> as
    TRelation extends Relation
      ? ManyToManyFieldRef2Name<TDataFormats, TRelation>
      : never
  ]: RelationToForeignDataFormat<TDataFormats, TRelation & Relation, TLocalDataFormatName>
}

/**
 * The dict that maps a related data property name to the foreign data format
 */
export type RelatedDataPropertyNameToForeignDataFormatDict<
  TDataFormats extends DataFormats,
  TRelations extends Relations,
  TLocalDataFormatName extends string,
> = OneToOneFromOneDict<TDataFormats, TRelations, TLocalDataFormatName>
  & OneToOneToOneDict<TDataFormats, TRelations, TLocalDataFormatName>
  & OneToManyFromOneDict<TDataFormats, TRelations, TLocalDataFormatName>
  & OneToManyToManyDict<TDataFormats, TRelations, TLocalDataFormatName>
  & ManyToManyFieldRef1Dict<TDataFormats, TRelations, TLocalDataFormatName>
  & ManyToManyFieldRef2Dict<TDataFormats, TRelations, TLocalDataFormatName>
