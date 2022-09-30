import { Relation, Relations, RelationType } from '.'
import { ValuesUnionFromDict } from '../../../helpers/types'
import { DataFormats } from '../../dataFormat/types'
import { ToRecord } from '../../dataFormat/types/record'
import { RelationToName } from './name'

/**
* Extracts the relations that are relevant to the given data format declaration name,
* where the given data format is the "from one" in the relations.
*/
export type ExtractRelevantRelationsWithOneToOneFromOne<
  TRelations extends Relations,
  TDataFormatName extends string,
> = Extract<ValuesUnionFromDict<TRelations>, { type: RelationType.ONE_TO_ONE, fromOneField: { dataFormat: TDataFormatName } }>

/**
* Extracts the relations that are relevant to the given data format declaration name,
* where the given data format is the "to one" in the relations.
*/
export type ExtractRelevantRelationsWithOneToOneToOne<
  TRelations extends Relations,
  TDataFormatName extends string
> = Extract<ValuesUnionFromDict<TRelations>, { type: RelationType.ONE_TO_ONE, toOneField: { dataFormat: TDataFormatName } }>

/**
* Extracts the relations that are relevant to the given data format declaration name,
* where the given data format is the "from one" in the relations.
*/
export type ExtractRelevantRelationsWithOneToManyFromOne<
  TRelations extends Relations,
  TDataFormatName extends string,
> = Extract<ValuesUnionFromDict<TRelations>, { type: RelationType.ONE_TO_MANY, fromOneField: { dataFormat: TDataFormatName } }>

/**
* Extracts the relations that are relevant to the given data format declaration name,
* where the given data format is the "to many" in the relations.
*/
export type ExtractRelevantRelationsWithOneToManyToMany<
  TRelations extends Relations,
  TDataFormatName extends string,
> = Extract<ValuesUnionFromDict<TRelations>, { type: RelationType.ONE_TO_MANY, toManyField: { dataFormat: TDataFormatName } }>

/**
* Extracts the relations that are relevant to the given data format declaration name,
* where the given data format is the "fieldRef1" in the relations.
*/
export type ExtractRelevantRelationsWithManyToManyFieldRef1<
  TRelations extends Relations,
  TDataFormatName extends string,
> = Extract<ValuesUnionFromDict<TRelations>, { type: RelationType.MANY_TO_MANY, fieldRef1: { dataFormat: TDataFormatName } }>

/**
* Extracts the relations that are relevant to the given data format declaration name,
* where the given data format is the "fieldRef2" in the relations.
*/
export type ExtractRelevantRelationsWithManyToManyFieldRef2<
  TRelations extends Relations,
  TDataFormatName extends string
> = Extract<ValuesUnionFromDict<TRelations>, { type: RelationType.MANY_TO_MANY, fieldRef2: { dataFormat: TDataFormatName } }>

export type ExtractManyToManyRelations<TRelations extends Relations> =
  Extract<ValuesUnionFromDict<TRelations>, { type: RelationType.MANY_TO_MANY }>

export type ExtractManyToManyRelationNames<TRelations extends Relations, TDataFormats extends DataFormats> =
  // @ts-ignore This is ok
  RelationToName<ExtractManyToManyRelations<TRelations>, TDataFormats>

export type RelationToForeignFieldRef<
  TRelation extends Relation,
  TLocalDataFormatName extends string,
> = {
  [RelationType.MANY_TO_MANY]: TRelation extends { type: RelationType.MANY_TO_MANY }
    ? TRelation['fieldRef1']['dataFormat'] extends TLocalDataFormatName
      ? TRelation['fieldRef2']
      : TRelation['fieldRef1']
    : never
  [RelationType.ONE_TO_MANY]: TRelation extends { type: RelationType.ONE_TO_MANY }
    ? TRelation['fromOneField']['dataFormat'] extends TLocalDataFormatName
      ? TRelation['toManyField']
      : TRelation['fromOneField']
    : never
  [RelationType.ONE_TO_ONE]: TRelation extends { type: RelationType.ONE_TO_ONE }
    ? TRelation['fromOneField']['dataFormat'] extends TLocalDataFormatName
      ? TRelation['toOneField']
      : TRelation['fromOneField']
    : never
}[TRelation['type']]

export type RelationToForeignFieldName<
  TRelation extends Relation,
  TLocalDataFormatName extends string,
> = RelationToForeignFieldRef<TRelation, TLocalDataFormatName>['field']

export type RelationToForeignDataFormatName<
  TRelation extends Relation,
  TLocalDataFormatName extends string,
> = RelationToForeignFieldRef<TRelation, TLocalDataFormatName>['dataFormat']

export type RelationToForeignDataFormat<
  TDataFormats extends DataFormats,
  TRelation extends Relation,
  TLocalDataFormatName extends string,
> = TDataFormats[RelationToForeignDataFormatName<TRelation, TLocalDataFormatName>]

export type RelationToForeignRecord<
  TDataFormats extends DataFormats,
  TRelation extends Relation,
  TLocalDataFormatName extends string,
> = ToRecord<RelationToForeignDataFormat<TDataFormats, TRelation, TLocalDataFormatName>['fields']>

export type IsForeignFormatPluralFromRelation<
  TRelation extends Relation,
  TLocalDataFormatName extends string,
> = {
  [RelationType.MANY_TO_MANY]: true
  [RelationType.ONE_TO_MANY]: TRelation extends { type: RelationType.ONE_TO_MANY }
    ? TRelation['fromOneField']['dataFormat'] extends TLocalDataFormatName
      ? true
      : false
    : never
  [RelationType.ONE_TO_ONE]: false
}[TRelation['type']]
