import { DataFormatDeclarations, ToRecord } from '../../dataFormat/types'
import {
  RelationDeclarations,
  ExtractForeignFormatNameFromRelation,
  RelationDeclaration,
  ExtractRelevantRelationsWithOneToOneToOne,
  ExtractRelevantRelationsWithOneToOneFromOne,
  ExtractRelevantRelationsWithOneToManyFromOne,
  ExtractRelevantRelationsWithOneToManyToMany,
  ExtractRelevantRelationsWithManyToManyFieldRef1,
  ExtractRelevantRelationsWithManyToManyFieldRef2,
} from '../../relations/types'
import {
  ManyToManyFieldRef1Name,
  ManyToManyFieldRef2Name,
  OneToManyFromOneName,
  OneToManyToManyName,
  OneToOneFromOneName,
  OneToOneToOneName,
} from './relatedDataPropNames'

/**
 * Gets the entity record of the foreign entity of the given relation declaration (K),
 * from the data format declarations (T), for the given (local) data format name (L).
 */
export type ExtractRelationForeignRecord<
  T extends DataFormatDeclarations,
  K extends RelationDeclaration<T>,
  L extends T[number]['name']
> = ToRecord<
  Extract<
    T[number],
    { name: ExtractForeignFormatNameFromRelation<K, L> }
  >
>

export type OneToOneFromOneDict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  [TRelation in ExtractRelevantRelationsWithOneToOneFromOne<L, K> as
    OneToOneFromOneName<T, TRelation>
  ]: ExtractRelationForeignRecord<T, TRelation, L>
}

export type OneToOneToOneDict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  [TRelation in ExtractRelevantRelationsWithOneToOneToOne<L, K> as
    OneToOneToOneName<T, TRelation>
  ]: ExtractRelationForeignRecord<T, TRelation, L>
}

export type OneToManyFromOneDict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  [TRelation in ExtractRelevantRelationsWithOneToManyFromOne<L, K> as
    OneToManyFromOneName<T, TRelation>
  ]: ExtractRelationForeignRecord<T, TRelation, L>[]
}

export type OneToManyToManyDict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  [TRelation in ExtractRelevantRelationsWithOneToManyToMany<L, K> as
    OneToManyToManyName<T, TRelation>
  ]: ExtractRelationForeignRecord<T, TRelation, L>
}

export type ManyToManyFieldRef1Dict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  [TRelation in ExtractRelevantRelationsWithManyToManyFieldRef1<L, K> as
    ManyToManyFieldRef1Name<T, TRelation>
  ]: ExtractRelationForeignRecord<T, TRelation, L>
}

export type ManyToManyFieldRef2Dict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  [TRelation in ExtractRelevantRelationsWithManyToManyFieldRef2<L, K> as
    ManyToManyFieldRef2Name<T, TRelation>
  ]: ExtractRelationForeignRecord<T, TRelation, L>
}

/**
 * The dict that maps a related data property name to the related data
 * record or list of records.
 */
export type RelatedDataDict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = OneToOneFromOneDict<T, K, L>
  & OneToOneToOneDict<T, K, L>
  & OneToManyFromOneDict<T, K, L>
  & OneToManyToManyDict<T, K, L>
  & ManyToManyFieldRef1Dict<T, K, L>
  & ManyToManyFieldRef2Dict<T, K, L>

/**
 * All of the possible related data property names for a particular DFD.
 */
export type RelatedDataPropertyNamesUnion<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = keyof OneToOneFromOneDict<T, K, L>
  | keyof OneToOneToOneDict<T, K, L>
  | keyof OneToManyFromOneDict<T, K, L>
  | keyof OneToManyToManyDict<T, K, L>
  | keyof ManyToManyFieldRef1Dict<T, K, L>
  | keyof ManyToManyFieldRef2Dict<T, K, L>
