import { DataFormatList, DataFormatsFromOptions } from '../dataFormatNew/types'
import { AvailableFieldRefs } from '../dataFormatNew/types/fieldRef'
import { NamedItemListToDict, OmitTyped, TypeDependantBaseIntersection } from '../helpers/types'

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
   *
   * Note: Many-to-many relations require a join (a.k.a "junction"/"mapping") table.
   * Use `createJoinTables` to create them once the relations have been loaded into
   * the TsPgOrm instance.
   */
  MANY_TO_MANY,
}

type RelationOptionsBase = { name?: string }

export type RelationOptions<
  TRelationType extends RelationType = RelationType,
  TDataFormatList extends DataFormatList = DataFormatList,
  TDataFormatsFromOptions extends DataFormatsFromOptions<TDataFormatList> = DataFormatsFromOptions<TDataFormatList>
> = TypeDependantBaseIntersection<RelationType, {
  [RelationType.ONE_TO_ONE]: {
    fromOneField: AvailableFieldRefs<TDataFormatList, TDataFormatsFromOptions>
    toOneField: AvailableFieldRefs<TDataFormatList, TDataFormatsFromOptions>
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
    fromOneField: AvailableFieldRefs<TDataFormatList, TDataFormatsFromOptions>
    toManyField: AvailableFieldRefs<TDataFormatList, TDataFormatsFromOptions>
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
    fieldRef1: AvailableFieldRefs<TDataFormatList, TDataFormatsFromOptions>
    fieldRef2: AvailableFieldRefs<TDataFormatList, TDataFormatsFromOptions>
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
    /**
     * Alternative name to use for the store that will represent the underlying join (a.k.a. "junction")
     * table.
     */
    joinTableStoreName?: string
  },
}, TRelationType> & RelationOptionsBase

export type RelationOptionsList<
  TDataFormatList extends DataFormatList = DataFormatList,
  TDataFormatsFromOptions extends DataFormatsFromOptions<TDataFormatList> = DataFormatsFromOptions<TDataFormatList>
> = Readonly<RelationOptions<RelationType, TDataFormatList, TDataFormatsFromOptions>[]>

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
    joinTableFieldRef1ColumnName: string
    joinTableFieldRef2ColumnName: string
    dropJoinTableSql: string
  },
}, T>

export type ToRelationName<
  T extends RelationOptions
> = {
  [RelationType.ONE_TO_ONE]: T extends { type: RelationType.ONE_TO_ONE } ? `${T['fromOneField']['formatName']}.${T['fromOneField']['fieldName']} <--> ${T['toOneField']['formatName']}.${T['toOneField']['fieldName']}` : never
  [RelationType.ONE_TO_MANY]: T extends { type: RelationType.ONE_TO_MANY } ? `${T['fromOneField']['formatName']}.${T['fromOneField']['fieldName']} <-->> ${T['toManyField']['formatName']}.${T['toManyField']['fieldName']}` : never
  [RelationType.MANY_TO_MANY]: T extends { type: RelationType.MANY_TO_MANY } ? `${T['fieldRef1']['formatName']}.${T['fieldRef1']['fieldName']} <<-->> ${T['fieldRef2']['formatName']}.${T['fieldRef2']['fieldName']}` : never
}[T['type']]

export type Relation<
  TRelationType extends RelationType = RelationType,
  TDataFormatList extends DataFormatList = DataFormatList,
  TDataFormatsFromOptions extends DataFormatsFromOptions<TDataFormatList> = DataFormatsFromOptions<TDataFormatList>,
  // eslint-disable-next-line max-len
  TOptions extends RelationOptions<TRelationType, TDataFormatList, TDataFormatsFromOptions> = RelationOptions<TRelationType, TDataFormatList, TDataFormatsFromOptions>
> = Omit<TOptions, 'name'>
  & RelationSqlProperties<TRelationType>
  & {
    // @ts-ignore
    name: TOptions extends { name: string } ? TOptions['name'] : ToRelationName<TOptions>
  }

export type RelationsFromOptions<
  TDataFormatList extends DataFormatList = DataFormatList,
  TDataFormatsFromOptions extends DataFormatsFromOptions<TDataFormatList> = DataFormatsFromOptions<TDataFormatList>,
  // eslint-disable-next-line max-len
  TRelationOptionsList extends RelationOptionsList<TDataFormatList, TDataFormatsFromOptions> = RelationOptionsList<TDataFormatList, TDataFormatsFromOptions>
> = {
  [TIndex in keyof TRelationOptionsList & `${bigint}` as
    ToRelationName<TRelationOptionsList[TIndex] extends RelationOptions
      ? TRelationOptionsList[TIndex]
      : never
    >
  ]:
    TRelationOptionsList[TIndex] extends RelationOptions
      ? Relation<TRelationOptionsList[TIndex]['type']>
      : never
}

export type RelationList = Readonly<Relation[]>

export type Relations = {
  [relationName: string]: Relation
}
