import { DataFormatDeclarations } from '../../../dataFormat/types'
import {
  RelationDeclarations,
  ExtractRelevantRelationsWithOneToOneToOne,
  ExtractRelevantRelationsWithOneToOneFromOne,
  ExtractRelevantRelationsWithOneToManyFromOne,
  ExtractRelevantRelationsWithOneToManyToMany,
  ExtractRelevantRelationsWithManyToManyFieldRef1,
  ExtractRelevantRelationsWithManyToManyFieldRef2,
  ExtractForeignFormatNameFromRelation,
  RelationDeclaration,
} from '../../../relations/types'
import {
  ManyToManyFieldRef1Name,
  ManyToManyFieldRef2Name,
  OneToManyFromOneName,
  OneToManyToManyName,
  OneToOneFromOneName,
  OneToOneToOneName,
} from './relatedDataPropNames'

type GetForeignDataFormatOfRelation<
  T extends DataFormatDeclarations,
  K extends RelationDeclaration,
  L extends T[number]['name'],
> = Extract<T[number], { name: ExtractForeignFormatNameFromRelation<K, L> }>

type OneToOneFromOneDict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  [TRelation in ExtractRelevantRelationsWithOneToOneFromOne<L, K> as
    OneToOneFromOneName<T, TRelation>
  ]: GetForeignDataFormatOfRelation<T, TRelation, L>
}

type OneToOneToOneDict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  [TRelation in ExtractRelevantRelationsWithOneToOneToOne<L, K> as
    OneToOneToOneName<T, TRelation>
  ]: GetForeignDataFormatOfRelation<T, TRelation, L>
}

type OneToManyFromOneDict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  [TRelation in ExtractRelevantRelationsWithOneToManyFromOne<L, K> as
    OneToManyFromOneName<T, TRelation>
  ]: GetForeignDataFormatOfRelation<T, TRelation, L>
}

type OneToManyToManyDict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  [TRelation in ExtractRelevantRelationsWithOneToManyToMany<L, K> as
    OneToManyToManyName<T, TRelation>
  ]: GetForeignDataFormatOfRelation<T, TRelation, L>
}

type ManyToManyFieldRef1Dict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  [TRelation in ExtractRelevantRelationsWithManyToManyFieldRef1<L, K> as
    ManyToManyFieldRef1Name<T, TRelation>
  ]: GetForeignDataFormatOfRelation<T, TRelation, L>
}

type ManyToManyFieldRef2Dict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  [TRelation in ExtractRelevantRelationsWithManyToManyFieldRef2<L, K> as
    ManyToManyFieldRef2Name<T, TRelation>
  ]: GetForeignDataFormatOfRelation<T, TRelation, L>
}

/**
 * The dict that maps a related data property name to the relation
 */
export type RelatedDataPropertyNameToForeignDataFormatDict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = OneToOneFromOneDict<T, K, L>
  & OneToOneToOneDict<T, K, L>
  & OneToManyFromOneDict<T, K, L>
  & OneToManyToManyDict<T, K, L>
  & ManyToManyFieldRef1Dict<T, K, L>
  & ManyToManyFieldRef2Dict<T, K, L>
