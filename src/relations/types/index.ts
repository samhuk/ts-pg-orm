import { TypeDependantBaseIntersection } from '../../helpers/types'
import { DataFormat, DataFormats } from '../../dataFormat/types'
import { AvailableFieldRefsOfDataFormats, FieldRef } from '../../dataFormat/types/fieldRef'
import { RelationOptionsToName } from './name'
import { RelationSql } from './sql'
import { Field } from '../../dataFormat/types/field'

export type ResovledRelationInfo = {
  leftDataFormat: DataFormat
  rightDataFormat: DataFormat
  leftField: Field
  rightField: Field
}

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
  ONE_TO_ONE = 'one_to_one',
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
  ONE_TO_MANY = 'one_to_many',
  /**
   * Multiple items of this format relates to multiple items of another format.
   *
   * For example, user <<-->> userGroup is a many-to-many relation since multiple
   * users can be related to one user group and multiple user groups can be related
   * to one user.
   *
   * Note: Many-to-many relations require a join (a.k.a "junction"/"mapping") table.
   * Use `createJoinTables` to create them once the relations have been loaded into
   * the TsPgOrm instance.
   */
  MANY_TO_MANY = 'many_to_many',
}

type _RelationOptions<
  TRelationType extends RelationType = RelationType,
  TAvailableFieldRefs extends FieldRef = FieldRef,
> = TypeDependantBaseIntersection<RelationType, {
  [RelationType.ONE_TO_ONE]: {
    fromOneField: TAvailableFieldRefs
    toOneField: TAvailableFieldRefs
    /**
     * The related data property name of `toOneField` records that are related to `fromOneField` record(s).
     */
    relatedFromOneRecordsName?: string
    /**
     * The related data property name of `fromOneField` records that are related to `toOneField` record(s).
     */
    relatedToOneRecordsName?: string
  },
  [RelationType.ONE_TO_MANY]: {
    fromOneField: TAvailableFieldRefs
    toManyField: TAvailableFieldRefs
    /**
     * The related data property name of `toManyField` records that are related to `fromOneField` record(s).
     */
    relatedFromOneRecordsName?: string
    /**
     * The related data property name of `fromOneField` records that are related to `toManyField` record(s).
     */
    relatedToManyRecordsName?: string
  },
  [RelationType.MANY_TO_MANY]: {
    /**
     * Determines whether the join (a.k.a. "junction") table will have a `dateCreated` field (i.e. a
     * `date_created` column).
     *
     * @default false
     */
    includeDateCreated?: boolean
    fieldRef1: TAvailableFieldRefs
    fieldRef2: TAvailableFieldRefs
    /**
     * The related data property name of `fieldRef1` records that are related to `fieldRef2` record(s).
     */
    relatedFieldRef1RecordsName?: string
    /**
     * The related data property name of `fieldRef2` records that are related to `fieldRef1` record(s).
     */
    relatedFieldRef2RecordsName?: string
    /**
     * Determines if "ON UPDATE NO ACTION" is added for the `fieldRef1` foreign constraint.
     *
     * @default true
     */
    fieldRef1OnUpdateNoAction?: boolean
    /**
     * Determines if "ON DELETE NO ACTION" is added for the `fieldRef1` foreign constraint.
     *
     * @default true
     */
    fieldRef1OnDeleteNoAction?: boolean
    /**
     * Determines if "ON UPDATE NO ACTION" is added for the `fieldRef2` foreign constraint.
     *
     * @default true
     */
    fieldRef2OnUpdateNoAction?: boolean
    /**
     * Determines if "ON DELETE NO ACTION" is added for the `fieldRef2` foreign constraint.
     *
     * @default true
     */
    fieldRef2OnDeleteNoAction?: boolean
  },
}, TRelationType>

export type RelationOptions<
  TRelationType extends RelationType = RelationType,
  TDataFormats extends DataFormats = DataFormats
> = _RelationOptions<TRelationType, AvailableFieldRefsOfDataFormats<TDataFormats>>

type MutableRelationOptionsList<TDataFormats extends DataFormats = DataFormats> = RelationOptions<RelationType, TDataFormats>[]

export type RelationOptionsList<TDataFormats extends DataFormats = DataFormats> = Readonly<MutableRelationOptionsList<TDataFormats>>

export type Relation<
  TRelationType extends RelationType = RelationType,
  TDataFormats extends DataFormats = DataFormats,
  TRelationOptions extends RelationOptions<TRelationType, TDataFormats> = RelationOptions<TRelationType, TDataFormats>,
> = TRelationOptions & {
  name: RelationOptionsToName<TRelationOptions, TDataFormats>
} & RelationSql<TRelationType>

export type Relations<
  TDataFormats extends DataFormats = DataFormats,
  TRelationOptionsList extends RelationOptionsList<TDataFormats> = RelationOptionsList<TDataFormats>,
> = {
  [K in keyof TRelationOptionsList & `${bigint}` as TRelationOptionsList[K] extends infer TRelationOptions
    ? TRelationOptions extends RelationOptions
      ? RelationOptionsToName<TRelationOptions, TDataFormats>
      : never
    : never
  ]: TRelationOptionsList[K] extends RelationOptions<RelationType, TDataFormats>
    ? Relation<TRelationOptionsList[K]['type'], TDataFormats, TRelationOptionsList[K]>
    : never
}

export type RelationList<
  TDataFormats extends DataFormats = DataFormats,
> = Relation<RelationType, TDataFormats>[]

export type NonManyToManyRelationList<
  TDataFormats extends DataFormats = DataFormats,
> = Relation<RelationType.ONE_TO_ONE | RelationType.ONE_TO_MANY, TDataFormats>[]
