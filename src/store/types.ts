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
  K extends RelationDeclaration<DataFormatDeclarations, RelationType.ONE_TO_ONE>
> = K extends { getRelatedToOneFieldRecordsStoreName: string }
  ? K['getRelatedToOneFieldRecordsStoreName']
  : `getRelated${Capitalize<K['toOneField']['formatName']>}RecordOn${Capitalize<K['toOneField']['fieldName']>}`

export type OneToOneToOneFunctionName<
  K extends RelationDeclaration<DataFormatDeclarations, RelationType.ONE_TO_ONE>
> = K extends { getRelatedFromOneFieldRecordsStoreName: string }
  ? K['getRelatedFromOneFieldRecordsStoreName']
  : `getRelated${Capitalize<K['fromOneField']['formatName']>}RecordOn${Capitalize<K['fromOneField']['fieldName']>}`

export type OneToManyFromOneFunctionName<
   K extends RelationDeclaration<DataFormatDeclarations, RelationType.ONE_TO_MANY>
> = K extends { getRelatedToManyFieldRecordsStoreName: string }
  ? K['getRelatedToManyFieldRecordsStoreName']
  : `getRelated${Capitalize<K['toManyField']['formatName']>}RecordsOn${Capitalize<K['toManyField']['fieldName']>}`

export type OneToManyToManyFunctionName<
   K extends RelationDeclaration<DataFormatDeclarations, RelationType.ONE_TO_MANY>
> = K extends { getRelatedFromOneFieldRecordsStoreName: string }
  ? K['getRelatedFromOneFieldRecordsStoreName']
  : `getRelated${Capitalize<K['fromOneField']['formatName']>}RecordOn${Capitalize<K['fromOneField']['fieldName']>}`

export type ManyToManyFieldRef1FunctionName<
  K extends RelationDeclaration<DataFormatDeclarations, RelationType.MANY_TO_MANY>
> = K extends { getRelatedFieldRef2RecordsStoreName: string }
  ? K['getRelatedFieldRef2RecordsStoreName']
  : `getRelated${Capitalize<K['fieldRef2']['formatName']>}RecordsOn${Capitalize<K['fieldRef2']['fieldName']>}`

export type ManyToManyFieldRef2FunctionName<
  K extends RelationDeclaration<DataFormatDeclarations, RelationType.MANY_TO_MANY>
> = K extends { getRelatedFieldRef1RecordsStoreName: string }
  ? K['getRelatedFieldRef1RecordsStoreName']
  : `getRelated${Capitalize<K['fieldRef1']['formatName']>}RecordsOn${Capitalize<K['fieldRef1']['fieldName']>}`

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
    > as OneToOneFromOneFunctionName<RelationsDict<T, K>[K1]>
  ]: (linkedFieldValue: ExtractRelationForeignFieldValueType<T, RelationsDict<T, K>[K1], L>) => (
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
    > as OneToOneToOneFunctionName<RelationsDict<T, K>[K1]>
  ]: (linkedFieldValue: ExtractRelationForeignFieldValueType<T, RelationsDict<T, K>[K1], L>) => (
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
    > as OneToManyFromOneFunctionName<RelationsDict<T, K>[K1]>
  ]: (linkedFieldValue: ExtractRelationForeignFieldValueType<T, RelationsDict<T, K>[K1], L>) => (
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
    > as OneToManyToManyFunctionName<RelationsDict<T, K>[K1]>
  ]: (linkedFieldValue: ExtractRelationForeignFieldValueType<T, RelationsDict<T, K>[K1], L>) => (
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
    > as ManyToManyFieldRef1FunctionName<RelationsDict<T, K>[K1]>
  ]: (linkedFieldValue: ExtractRelationForeignFieldValueType<T, RelationsDict<T, K>[K1], L>) => (
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
    > as ManyToManyFieldRef2FunctionName<RelationsDict<T, K>[K1]>
  ]: (linkedFieldValue: ExtractRelationForeignFieldValueType<T, RelationsDict<T, K>[K1], L>) => (
    Promise<ExtractRelationForeignRecord<T, RelationsDict<T, K>[K1], L>[]>
  )
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

export type Store<
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  // The chosen data format declaration name
  L extends T[number]['name'],
  // The data format declaration
> = StoreBase<Extract<T[number], { name: L }>>
  & RelationGetterFunctionsDict<T, K, L>
  & {
    unprovision: () => Promise<boolean>
    provision: () => Promise<boolean>
  }
