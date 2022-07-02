import { ExpandRecursively, TypeDependantBaseIntersection, DeepReadonly, ValuesUnionFromDict } from '../helpers/types'
import { DataFormatDeclarations, DataFormat } from '../dataFormat/types'

export enum RelationType {
  /**
   * One item of this format relates to one item of another format.
   *
   * For example, user <-> userAddress is a one-to-one relation since one
   * user is related to only one user address and one user address is related
   * to only one user.
   *
   * Local field: unique
   *
   * Foreign field: unique
   */
  ONE_TO_ONE,
  /**
   * One item of this format relates to multiple items on another format.
   *
   * For example, customer <-->> customerOrders is a one-to-many relation
   * since a customer can have multiple orders, but an order is owned by only
   * one customer.
   *
   * Local field: unique
   *
   * Foreign field: not unique
   */
  ONE_TO_MANY,
  /**
   * Multiple items of this format relates to multiple items of another format.
   *
   * For example, user <<-->> userGroup is a many-to-many relation since multiple
   * users can be related to one user group and multiple user groups can be related
   * to one user.
   */
  MANY_TO_MANY,
}

type ExtractAvailableFieldRefs<T extends DataFormatDeclarations> = ExpandRecursively<ValuesUnionFromDict<{
  [K in T[number]['name']]: ValuesUnionFromDict<DataFormat<Extract<T[number], { name: K }>>['fieldRefs']>
}>>

type MutableRelationDeclaration<
  T extends DataFormatDeclarations,
  K extends RelationType = RelationType,
> = TypeDependantBaseIntersection<RelationType, {
  [RelationType.ONE_TO_ONE]: {
    fromOneField: ExtractAvailableFieldRefs<T>
    toOneField: ExtractAvailableFieldRefs<T>
    getRelatedFromOneRecordsName?: string
    getRelatedToOneRecordsName?: string
    relatedFromOneRecordsName?: string
    relatedToOneRecordsName?: string
  },
  [RelationType.ONE_TO_MANY]: {
    fromOneField: ExtractAvailableFieldRefs<T>
    toManyField: ExtractAvailableFieldRefs<T>
    getRelatedFromOneRecordsName?: string
    getRelatedToManyRecordsName?: string
    relatedFromOneRecordsName?: string
    relatedToManyRecordsName?: string
  },
  [RelationType.MANY_TO_MANY]: {
    includeDateCreated?: boolean
    fieldRef1: ExtractAvailableFieldRefs<T>
    fieldRef2: ExtractAvailableFieldRefs<T>
    getRelatedFieldRef1RecordsName?: string
    getRelatedFieldRef2RecordsName?: string
    relatedFieldRef1RecordsName?: string
    relatedFieldRef2RecordsName?: string
  },
}, K>

export type RelationDeclaration<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  K extends RelationType = RelationType
> = DeepReadonly<MutableRelationDeclaration<T, K>>

export type RelationDeclarations<T extends DataFormatDeclarations = DataFormatDeclarations> = Readonly<RelationDeclaration<T>[]>

export type ExtractRelationNameFromRelationDeclaration<
  K extends RelationDeclaration
> = {
  [RelationType.MANY_TO_MANY]: K extends { type: RelationType.MANY_TO_MANY } ? `${K['fieldRef1']['formatName']}.${K['fieldRef1']['fieldName']} <<-->> ${K['fieldRef2']['formatName']}.${K['fieldRef2']['fieldName']}` : never
  [RelationType.ONE_TO_MANY]: K extends { type: RelationType.ONE_TO_MANY } ? `${K['fromOneField']['formatName']}.${K['fromOneField']['fieldName']} <-->> ${K['toManyField']['formatName']}.${K['toManyField']['fieldName']}` : never
  [RelationType.ONE_TO_ONE]: K extends { type: RelationType.ONE_TO_ONE } ? `${K['fromOneField']['formatName']}.${K['fromOneField']['fieldName']} <--> ${K['toOneField']['formatName']}.${K['toOneField']['fieldName']}` : never
}[K['type']]

export type ExtractLocalFieldRefFromRelation<
  K extends RelationDeclaration,
  // The local data format name
  L extends string
> = {
  [RelationType.MANY_TO_MANY]: K extends { type: RelationType.MANY_TO_MANY }
    ? K['fieldRef1']['formatName'] extends L
      ? K['fieldRef1']
      : K['fieldRef2']
    : never
  [RelationType.ONE_TO_MANY]: K extends { type: RelationType.ONE_TO_MANY }
    ? K['fromOneField']['formatName'] extends L
      ? K['fromOneField']
      : K['toManyField']
    : never
  [RelationType.ONE_TO_ONE]: K extends { type: RelationType.ONE_TO_ONE }
    ? K['fromOneField']['formatName'] extends L
      ? K['fromOneField']
      : K['toOneField']
    : never
}[K['type']]

export type ExtractForeignFieldRefFromRelation<
  K extends RelationDeclaration,
  // The local data format name
  L extends string
> = {
  [RelationType.MANY_TO_MANY]: K extends { type: RelationType.MANY_TO_MANY }
    ? K['fieldRef1']['formatName'] extends L
      ? K['fieldRef2']
      : K['fieldRef1']
    : never
  [RelationType.ONE_TO_MANY]: K extends { type: RelationType.ONE_TO_MANY }
    ? K['fromOneField']['formatName'] extends L
      ? K['toManyField']
      : K['fromOneField']
    : never
  [RelationType.ONE_TO_ONE]: K extends { type: RelationType.ONE_TO_ONE }
    ? K['fromOneField']['formatName'] extends L
      ? K['toOneField']
      : K['fromOneField']
    : never
}[K['type']]

export type ExtractForeignFieldNameFromRelation<
  K extends RelationDeclaration,
  // The local data format name
  L extends string
> = ExtractForeignFieldRefFromRelation<K, L>['fieldName']

export type ExtractForeignFormatNameFromRelation<
  K extends RelationDeclaration,
  // The local data format name
  L extends string
> = ExtractForeignFieldRefFromRelation<K, L>['formatName']

type RelationSqlProperties<
  T extends RelationType = RelationType,
> = TypeDependantBaseIntersection<RelationType, {
  [RelationType.ONE_TO_ONE]: {
    foreignKeySql: string
  },
  [RelationType.ONE_TO_MANY]: {
    foreignKeySql: string
  },
  [RelationType.MANY_TO_MANY]: {
    createJoinTableSql: string
    joinTableName: string
    dropJoinTableSql: string
  },
}, T>

export type Relation<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  K extends RelationType = RelationType,
  L extends RelationDeclaration<T, K> = RelationDeclaration<T, K>
> = L & {
  sql: RelationSqlProperties<K>
}

export type RelationsDict<T extends DataFormatDeclarations, K extends RelationDeclarations<T>> = {
  [K1 in keyof K & `${bigint}` as K[K1] extends infer TRelationDeclaration
    ? ExtractRelationNameFromRelationDeclaration<TRelationDeclaration & RelationDeclaration<T>>
    : never
  // @ts-ignore
  ]: K[K1] extends RelationDeclaration<T> ? Relation<T, K[K1]['type'], K[K1]> : never
}

export type RelationsList<T extends DataFormatDeclarations, K extends RelationDeclarations<T>> = {
  // @ts-ignore
  [K1 in keyof K & `${bigint}`]: K[K1] extends RelationDeclaration<T> ? Relation<T, K[K1]['type'], K[K1]> : never
}

export type ExtractRelationNamesOfManyToManyRelations<T extends RelationDeclarations> =
  ExtractRelationNameFromRelationDeclaration<Extract<T[number], { type: RelationType.MANY_TO_MANY }>>

/**
 * Extracts the relations that are relevant to the given data format declaration name.
 *
 * A relation is relevant when the given data format declaration name features in either
 * of the sides of the relation.
 */
export type ExtractRelevantRelations<T extends string, K extends RelationDeclarations> =
  Extract<K[number], { fromOneField: { formatName: T } }>
    | Extract<K[number], { toOneField: { formatName: T } }>
    | Extract<K[number], { toManyField: { formatName: T } }>
    | Extract<K[number], { fieldRef1: { formatName: T } }>
    | Extract<K[number], { fieldRef2: { formatName: T } }>

/**
* Extracts the relations that are relevant to the given data format declaration name,
* where the given data format is the "from one" in the relations.
*/
export type ExtractRelevantRelationsWithOneToOneFromOne<T extends string, K extends RelationDeclarations> =
Extract<ExtractRelevantRelations<T, K>, { type: RelationType.ONE_TO_ONE, fromOneField: { formatName: T } }>

/**
* Extracts the relations that are relevant to the given data format declaration name,
* where the given data format is the "to one" in the relations.
*/
export type ExtractRelevantRelationsWithOneToOneToOne<T extends string, K extends RelationDeclarations> =
  Extract<ExtractRelevantRelations<T, K>, { type: RelationType.ONE_TO_ONE, toOneField: { formatName: T } }>

/**
* Extracts the relations that are relevant to the given data format declaration name,
* where the given data format is the "from one" in the relations.
*/
export type ExtractRelevantRelationsWithOneToManyFromOne<T extends string, K extends RelationDeclarations> =
  Extract<ExtractRelevantRelations<T, K>, { type: RelationType.ONE_TO_MANY, fromOneField: { formatName: T } }>

/**
* Extracts the relations that are relevant to the given data format declaration name,
* where the given data format is the "to many" in the relations.
*/
export type ExtractRelevantRelationsWithOneToManyToMany<T extends string, K extends RelationDeclarations> =
  Extract<ExtractRelevantRelations<T, K>, { type: RelationType.ONE_TO_MANY, toManyField: { formatName: T } }>

/**
* Extracts the relations that are relevant to the given data format declaration name,
* where the given data format is the "fieldRef1" in the relations.
*/
export type ExtractRelevantRelationsWithManyToManyFieldRef1<T extends string, K extends RelationDeclarations> =
  Extract<ExtractRelevantRelations<T, K>, { type: RelationType.MANY_TO_MANY, fieldRef1: { formatName: T } }>

/**
* Extracts the relations that are relevant to the given data format declaration name,
* where the given data format is the "fieldRef2" in the relations.
*/
export type ExtractRelevantRelationsWithManyToManyFieldRef2<T extends string, K extends RelationDeclarations> =
  Extract<ExtractRelevantRelations<T, K>, { type: RelationType.MANY_TO_MANY, fieldRef2: { formatName: T } }>

// --

export type ExtractRelevantRelationNamesWithOneToOneFromOne<T extends string, K extends RelationDeclarations> =
  ExtractRelationNameFromRelationDeclaration<ExtractRelevantRelationsWithOneToOneFromOne<T, K>>

export type ExtractRelevantRelationNamesWithOneToOneToOne<T extends string, K extends RelationDeclarations> =
  ExtractRelationNameFromRelationDeclaration<ExtractRelevantRelationsWithOneToOneToOne<T, K>>

export type ExtractRelevantRelationNamesWithOneToManyFromOne<T extends string, K extends RelationDeclarations> =
  ExtractRelationNameFromRelationDeclaration<ExtractRelevantRelationsWithOneToManyFromOne<T, K>>

export type ExtractRelevantRelationNamesWithOneToManyToMany<T extends string, K extends RelationDeclarations> =
  ExtractRelationNameFromRelationDeclaration<ExtractRelevantRelationsWithOneToManyToMany<T, K>>

export type ExtractRelevantRelationNamesWithManyToManyFieldRef1<T extends string, K extends RelationDeclarations> =
  ExtractRelationNameFromRelationDeclaration<ExtractRelevantRelationsWithManyToManyFieldRef1<T, K>>

export type ExtractRelevantRelationNamesWithManyToManyFieldRef2<T extends string, K extends RelationDeclarations> =
  ExtractRelationNameFromRelationDeclaration<ExtractRelevantRelationsWithManyToManyFieldRef2<T, K>>

export type ExtractRelevantRelationNames<T extends string, K extends RelationDeclarations> =
  ExtractRelationNameFromRelationDeclaration<ExtractRelevantRelations<T, K>>
