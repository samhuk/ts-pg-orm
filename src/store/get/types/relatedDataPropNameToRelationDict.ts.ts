import { DataFormatDeclarations } from '../../../dataFormat/types'
import {
  RelationDeclarations,
  ExtractRelevantRelationsWithOneToOneToOne,
  ExtractRelevantRelationsWithOneToOneFromOne,
  ExtractRelevantRelationsWithOneToManyFromOne,
  ExtractRelevantRelationsWithOneToManyToMany,
  ExtractRelevantRelationsWithManyToManyFieldRef1,
  ExtractRelevantRelationsWithManyToManyFieldRef2,
} from '../../../relations/types'
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
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  [TRelation in ExtractRelevantRelationsWithOneToOneFromOne<L, K> as
    OneToOneFromOneName<T, TRelation>
  ]: TRelation
}

type OneToOneToOneDict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  [TRelation in ExtractRelevantRelationsWithOneToOneToOne<L, K> as
    OneToOneToOneName<T, TRelation>
  ]: TRelation
}

type OneToManyFromOneDict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  [TRelation in ExtractRelevantRelationsWithOneToManyFromOne<L, K> as
    OneToManyFromOneName<T, TRelation>
  ]: TRelation
}

type OneToManyToManyDict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  [TRelation in ExtractRelevantRelationsWithOneToManyToMany<L, K> as
    OneToManyToManyName<T, TRelation>
  ]: TRelation
}

type ManyToManyFieldRef1Dict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  [TRelation in ExtractRelevantRelationsWithManyToManyFieldRef1<L, K> as
    ManyToManyFieldRef1Name<T, TRelation>
  ]: TRelation
}

type ManyToManyFieldRef2Dict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  [TRelation in ExtractRelevantRelationsWithManyToManyFieldRef2<L, K> as
    ManyToManyFieldRef2Name<T, TRelation>
  ]: TRelation
}

/**
 * The dict that maps a related data property name to the relation
 */
export type RelatedDataPropertyNameToRelationDict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = OneToOneFromOneDict<T, K, L>
  & OneToOneToOneDict<T, K, L>
  & OneToManyFromOneDict<T, K, L>
  & OneToManyToManyDict<T, K, L>
  & ManyToManyFieldRef1Dict<T, K, L>
  & ManyToManyFieldRef2Dict<T, K, L>

export type GetRelationOfRelatedDataPropertyName<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
  P extends RelatedDataPropertyNamesUnion<T, K, L>,
> = RelatedDataPropertyNameToRelationDict<T, K, L>[P]
