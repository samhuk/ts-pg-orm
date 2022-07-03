import { PickAny } from '../helpers/types'
import {
  DataFormatDeclarations,
  DataFormatDeclarationToRecord,
  DataFormatFieldToRecordPropertyValue,
  DataFormatsDict,
} from '../dataFormat/types'
import {
  RelationDeclaration,
  RelationType,
  ExtractForeignFormatNameFromRelation,
  ExtractForeignFieldNameFromRelation,
  RelationDeclarations,
  RelationsDict,
  ExtractRelevantRelationNamesWithOneToOneFromOne,
  ExtractRelevantRelationNamesWithOneToOneToOne,
  ExtractRelevantRelationNamesWithOneToManyFromOne,
  ExtractRelevantRelationNamesWithOneToManyToMany,
  ExtractRelevantRelationNamesWithManyToManyFieldRef1,
  ExtractRelevantRelationNamesWithManyToManyFieldRef2,
} from '../relations/types'
import { StoreBase } from './base/types'

export type OneToOneFromOneFunctionName<
  T extends DataFormatDeclarations,
  K extends RelationDeclaration<T, RelationType.ONE_TO_ONE>,
> = K extends { getRelatedToOneRecordsName: string }
  ? K['getRelatedToOneRecordsName']
  // @ts-ignore
  : `get${DataFormatsDict<T>[K['toOneField']['formatName']]['capitalizedName']}Of${DataFormatsDict<T>[K['fromOneField']['formatName']]['capitalizedName']}`

export type OneToOneToOneFunctionName<
  T extends DataFormatDeclarations,
  K extends RelationDeclaration<T, RelationType.ONE_TO_ONE>
> = K extends { getRelatedFromOneRecordsName: string }
  ? K['getRelatedFromOneRecordsName']
  // @ts-ignore
  : `get${DataFormatsDict<T>[K['fromOneField']['formatName']]['capitalizedName']}Of${DataFormatsDict<T>[K['toOneField']['formatName']]['capitalizedName']}`

export type OneToManyFromOneFunctionName<
  T extends DataFormatDeclarations,
  K extends RelationDeclaration<T, RelationType.ONE_TO_MANY>
> = K extends { getRelatedToManyRecordsName: string }
  ? K['getRelatedToManyRecordsName']
  // @ts-ignore
  : `get${DataFormatsDict<T>[K['toManyField']['formatName']]['capitalizedPluralizedName']}Of${DataFormatsDict<T>[K['fromOneField']['formatName']]['capitalizedName']}`

export type OneToManyToManyFunctionName<
  T extends DataFormatDeclarations,
  K extends RelationDeclaration<T, RelationType.ONE_TO_MANY>
> = K extends { getRelatedFromOneRecordsName: string }
  ? K['getRelatedFromOneRecordsName']
  // @ts-ignore
  : `get${DataFormatsDict<T>[K['fromOneField']['formatName']]['capitalizedName']}Of${DataFormatsDict<T>[K['toManyField']['formatName']]['capitalizedName']}`

export type ManyToManyFieldRef1FunctionName<
  T extends DataFormatDeclarations,
  K extends RelationDeclaration<T, RelationType.MANY_TO_MANY>
> = K extends { getRelatedFieldRef2RecordsName: string }
  ? K['getRelatedFieldRef2RecordsName']
  // @ts-ignore
  : `get${DataFormatsDict<T>[K['fieldRef2']['formatName']]['capitalizedPluralizedName']}Of${DataFormatsDict<T>[K['fieldRef1']['formatName']]['capitalizedName']}`

export type ManyToManyFieldRef2FunctionName<
  T extends DataFormatDeclarations,
  K extends RelationDeclaration<T, RelationType.MANY_TO_MANY>
> = K extends { getRelatedFieldRef1RecordsName: string }
  ? K['getRelatedFieldRef1RecordsName']
  // @ts-ignore
  : `get${DataFormatsDict<T>[K['fieldRef1']['formatName']]['capitalizedPluralizedName']}Of${DataFormatsDict<T>[K['fieldRef2']['formatName']]['capitalizedName']}`

// --

export type OneToOneFromOneName<
  T extends DataFormatDeclarations,
  K extends RelationDeclaration<T, RelationType.ONE_TO_ONE>
> = K extends { relatedToOneRecordsName: string }
  ? K['relatedToOneRecordsName']
    // @ts-ignore
  : `${DataFormatsDict<T>[K['toOneField']['formatName']]['name']}`

export type OneToOneToOneName<
  T extends DataFormatDeclarations,
  K extends RelationDeclaration<T, RelationType.ONE_TO_ONE>
> = K extends { relatedFromOneRecordsName: string }
  ? K['relatedFromOneRecordsName']
  // @ts-ignore
  : `${DataFormatsDict<T>[K['fromOneField']['formatName']]['name']}`

export type OneToManyFromOneName<
  T extends DataFormatDeclarations,
  K extends RelationDeclaration<T, RelationType.ONE_TO_MANY>
> = K extends { relatedToManyRecordsName: string }
  ? K['relatedToManyRecordsName']
  // @ts-ignore
  : `${DataFormatsDict<T>[K['toManyField']['formatName']]['pluralizedName']}`

export type OneToManyToManyName<
  T extends DataFormatDeclarations,
  K extends RelationDeclaration<T, RelationType.ONE_TO_MANY>
> = K extends { relatedFromOneRecordsName: string }
  ? K['relatedFromOneRecordsName']
  // @ts-ignore
  : `${DataFormatsDict<T>[K['fromOneField']['formatName']]['name']}`

export type ManyToManyFieldRef1Name<
  T extends DataFormatDeclarations,
  K extends RelationDeclaration<T, RelationType.MANY_TO_MANY>
  // @ts-ignore
> = K extends { relatedFieldRef2RecordsName: string }
  ? K['relatedFieldRef2RecordsName']
  // @ts-ignore
  : `${DataFormatsDict<T>[K['fieldRef2']['formatName']]['pluralizedName']}`

export type ManyToManyFieldRef2Name<
  T extends DataFormatDeclarations,
  K extends RelationDeclaration<T, RelationType.MANY_TO_MANY>
  // @ts-ignore
> = K extends { relatedFieldRef1RecordsName: string }
  ? K['relatedFieldRef1RecordsName']
  // @ts-ignore
  : `${DataFormatsDict<T>[K['fieldRef1']['formatName']]['pluralizedName']}`

// --

/**
 * Gets the value type of the foreign data format field within the foreign entity
 * in the given relation declaration (K).
 */
type ExtractRelationForeignFieldValueType<
  T extends DataFormatDeclarations,
  K extends RelationDeclaration<T>,
  // The local data format name
  L extends T[number]['name']
> = DataFormatFieldToRecordPropertyValue<
  Extract<
    Extract<
      T[number],
      { name: ExtractForeignFormatNameFromRelation<K, L> }
    >['fields'][number],
    { name: ExtractForeignFieldNameFromRelation<K, L> }
  >
>

/**
 * Gets the entity record of the foreign entity of the given relation declaration (K),
 * from the data format declarations (T), for the given (local) data format name (L).
 */
type ExtractRelationForeignRecord<
  T extends DataFormatDeclarations,
  K extends RelationDeclaration<T>,
  // The local data format name
  L extends T[number]['name']
> = DataFormatDeclarationToRecord<
  Extract<
    T[number],
    { name: ExtractForeignFormatNameFromRelation<K, L> }
  >
>

export type OneToOneFromOneFunctionDict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  [K1 in keyof PickAny<
      RelationsDict<T, K>, ExtractRelevantRelationNamesWithOneToOneFromOne<L, K>
      // @ts-ignore
    > as OneToOneFromOneFunctionName<T, RelationsDict<T, K>[K1]>
    // @ts-ignore
  ]: (linkedFieldValue: ExtractRelationForeignFieldValueType<T, RelationsDict<T, K>[K1], L>) => (
    // @ts-ignore
    Promise<ExtractRelationForeignRecord<T, RelationsDict<T, K>[K1], L>>
  )
}

export type OneToOneToOneFunctionDict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  [K1 in keyof PickAny<
      RelationsDict<T, K>,
      ExtractRelevantRelationNamesWithOneToOneToOne<L, K>
      // @ts-ignore
    > as OneToOneToOneFunctionName<T, RelationsDict<T, K>[K1]>
    // @ts-ignore
  ]: (linkedFieldValue: ExtractRelationForeignFieldValueType<T, RelationsDict<T, K>[K1], L>) => (
    // @ts-ignore
    Promise<ExtractRelationForeignRecord<T, RelationsDict<T, K>[K1], L>>
  )
}

export type OneToManyFromOneFunctionDict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  [K1 in keyof PickAny<
      RelationsDict<T, K>,
      ExtractRelevantRelationNamesWithOneToManyFromOne<L, K>
      // @ts-ignore
    > as OneToManyFromOneFunctionName<T, RelationsDict<T, K>[K1]>
    // @ts-ignore
  ]: (linkedFieldValue: ExtractRelationForeignFieldValueType<T, RelationsDict<T, K>[K1], L>) => (
    // @ts-ignore
    Promise<ExtractRelationForeignRecord<T, RelationsDict<T, K>[K1], L>[]>
  )
}

export type OneToManyToManyFunctionDict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  [K1 in keyof PickAny<
     RelationsDict<T, K>,
     ExtractRelevantRelationNamesWithOneToManyToMany<L, K>
     // @ts-ignore
    > as OneToManyToManyFunctionName<T, RelationsDict<T, K>[K1]>
    // @ts-ignore
  ]: (linkedFieldValue: ExtractRelationForeignFieldValueType<T, RelationsDict<T, K>[K1], L>) => (
    // @ts-ignore
    Promise<ExtractRelationForeignRecord<T, RelationsDict<T, K>[K1], L>>
  )
}

export type ManyToManyFieldRef1FunctionDict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  [K1 in keyof PickAny<
      RelationsDict<T, K>,
      ExtractRelevantRelationNamesWithManyToManyFieldRef1<L, K>
      // @ts-ignore
    > as ManyToManyFieldRef1FunctionName<T, RelationsDict<T, K>[K1]>
    // @ts-ignore
  ]: (linkedFieldValue: ExtractRelationForeignFieldValueType<T, RelationsDict<T, K>[K1], L>) => (
    // @ts-ignore
    Promise<ExtractRelationForeignRecord<T, RelationsDict<T, K>[K1], L>[]>
  )
}

export type ManyToManyFieldRef2FunctionDict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  [K1 in keyof PickAny<
      RelationsDict<T, K>,
      ExtractRelevantRelationNamesWithManyToManyFieldRef2<L, K>
      // @ts-ignore
    > as ManyToManyFieldRef2FunctionName<T, RelationsDict<T, K>[K1]>
    // @ts-ignore
  ]: (linkedFieldValue: ExtractRelationForeignFieldValueType<T, RelationsDict<T, K>[K1], L>) => (
    // @ts-ignore
    Promise<ExtractRelationForeignRecord<T, RelationsDict<T, K>[K1], L>[]>
  )
}

// --

export type OneToOneFromOneDict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  [K1 in keyof PickAny<
      RelationsDict<T, K>, ExtractRelevantRelationNamesWithOneToOneFromOne<L, K>
      // @ts-ignore
    > as OneToOneFromOneName<T, RelationsDict<T, K>[K1]>
    // @ts-ignore
  ]: ExtractRelationForeignRecord<T, RelationsDict<T, K>[K1], L>
}

export type OneToOneToOneDict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  [K1 in keyof PickAny<
      RelationsDict<T, K>,
      ExtractRelevantRelationNamesWithOneToOneToOne<L, K>
      // @ts-ignore
    > as OneToOneToOneName<T, RelationsDict<T, K>[K1]>
    // @ts-ignore
  ]: ExtractRelationForeignRecord<T, RelationsDict<T, K>[K1], L>
}

export type OneToManyFromOneDict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  [K1 in keyof PickAny<
      RelationsDict<T, K>,
      ExtractRelevantRelationNamesWithOneToManyFromOne<L, K>
      // @ts-ignore
    > as OneToManyFromOneName<T, RelationsDict<T, K>[K1]>
    // @ts-ignore
  ]: ExtractRelationForeignRecord<T, RelationsDict<T, K>[K1], L>[]
}

export type OneToManyToManyDict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  [K1 in keyof PickAny<
     RelationsDict<T, K>,
     ExtractRelevantRelationNamesWithOneToManyToMany<L, K>
     // @ts-ignore
    > as OneToManyToManyName<T, RelationsDict<T, K>[K1]>
    // @ts-ignore
  ]: ExtractRelationForeignRecord<T, RelationsDict<T, K>[K1], L>
}

export type ManyToManyFieldRef1Dict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  [K1 in keyof PickAny<
      RelationsDict<T, K>,
      ExtractRelevantRelationNamesWithManyToManyFieldRef1<L, K>
      // @ts-ignore
    > as ManyToManyFieldRef1Name<T, RelationsDict<T, K>[K1]>
    // @ts-ignore
  ]: ExtractRelationForeignRecord<T, RelationsDict<T, K>[K1], L>[]
}

export type ManyToManyFieldRef2Dict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  [K1 in keyof PickAny<
      RelationsDict<T, K>,
      ExtractRelevantRelationNamesWithManyToManyFieldRef2<L, K>
      // @ts-ignore
    > as ManyToManyFieldRef2Name<T, RelationsDict<T, K>[K1]>
    // @ts-ignore
  ]: ExtractRelationForeignRecord<T, RelationsDict<T, K>[K1], L>[]
}

// --

export type RelationGetterFunctionsDict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = OneToOneFromOneFunctionDict<T, K, L>
  & OneToOneToOneFunctionDict<T, K, L>
  & OneToManyFromOneFunctionDict<T, K, L>
  & OneToManyToManyFunctionDict<T, K, L>
  & ManyToManyFieldRef1FunctionDict<T, K, L>
  & ManyToManyFieldRef2FunctionDict<T, K, L>

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

export type GetWithRelatedDataDict<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name'],
> = {
  /**
   * Gets the record with the given id, along with all it's immediate related records.
   */
  getByIdWithAllRelations: (id: number) => Promise<
    DataFormatDeclarationToRecord<Extract<T[number], { name: L }>> & RelatedDataDict<T, K, L>
  >
  /**
   * Gets the record with the given id, along with the selected immediate related records.
   */
  getByIdWithRelations: <
    TRelatedDataPropertyNames extends RelatedDataPropertyNamesUnion<T, K, L>[]
  >(id: number, relations: TRelatedDataPropertyNames) => Promise<
    DataFormatDeclarationToRecord<Extract<T[number], { name: L }>>
    & Pick<RelatedDataDict<T, K, L>, TRelatedDataPropertyNames[number]>
  >
}

export type StoreOptions<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  // The chosen data format declaration name
  L extends T[number]['name'],
> = {
  dataFormats: DataFormatsDict<T>,
  relations: RelationsDict<T, K>,
  dataFormatName: L,
}

/**
 * A store that is created for a particular entity
 */
export type Store<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  // The chosen data format declaration name
  L extends T[number]['name'],
  // The data format declaration
> = StoreBase<Extract<T[number], { name: L }>>
  & RelationGetterFunctionsDict<T, K, L>
  & GetWithRelatedDataDict<T, K, L>
  & {
    /**
     * Unrovisions the store, e.g. if a database store, this will drop the table.
     */
    unprovision: () => Promise<boolean>
    /**
     * Provisions the store, e.g. if a database store, this will create the table.
     */
    provision: () => Promise<boolean>
  }
