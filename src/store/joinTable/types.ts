import { DataQueryRecord } from '@samhuk/data-query/dist/types'
import { ExpandRecursively } from '../../helpers/types'
import { ReturnModeRaw } from '../types'
import { DataFormat, DataFormats } from '../../dataFormat/types'
import { Field, FieldToRecordType } from '../../dataFormat/types/field'
import { Relation, Relations, RelationType } from '../../relations/types'
import { ExtractManyToManyRelationNames } from '../../relations/types/relationExtraction'

type JoinTableRecordLinkedFields<
  TFieldRef1DataFormat extends DataFormat,
  TFieldRef2DataFormat extends DataFormat,
  TFieldRef1Field extends Field,
  TFieldRef2Field extends Field,
> = {
  [fieldRef1FieldName in `${TFieldRef1DataFormat['name']}${Capitalize<TFieldRef1Field['name']>}`]: FieldToRecordType<TFieldRef1Field>
} & {
  [fieldRef2FieldName in `${TFieldRef2DataFormat['name']}${Capitalize<TFieldRef2Field['name']>}`]: FieldToRecordType<TFieldRef2Field>
}

type JoinTableRecord<
  TFieldRef1DataFormat extends DataFormat,
  TFieldRef2DataFormat extends DataFormat,
  TFieldRef1Field extends Field,
  TFieldRef2Field extends Field,
  TRelation extends Relation<RelationType.MANY_TO_MANY> = Relation<RelationType.MANY_TO_MANY>,
> = ExpandRecursively<
  JoinTableRecordLinkedFields<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field>
  & {
    id: number // TODO: Do we need to make this configurable?
  }
  & (TRelation extends { includeDateCreated: boolean }
    ? TRelation['includeDateCreated'] extends true
      ? { dateCreated: string }
      : {}
    : {})
>

type CreateJoinTableRecordOptions<
  TFieldRef1DataFormat extends DataFormat,
  TFieldRef2DataFormat extends DataFormat,
  TFieldRef1Field extends Field,
  TFieldRef2Field extends Field,
> = JoinTableRecordLinkedFields<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field>

export type _CreateJoinTableRecordOptions<
  TDataFormats extends DataFormats = DataFormats,
  TRelation extends Relation<RelationType.MANY_TO_MANY> = Relation<RelationType.MANY_TO_MANY>,
> = CreateJoinTableRecordOptions<
  TDataFormats[TRelation['fieldRef1']['dataFormat']],
  TDataFormats[TRelation['fieldRef2']['dataFormat']],
  TDataFormats[TRelation['fieldRef1']['field']]['fields'][TRelation['fieldRef1']['field']],
  TDataFormats[TRelation['fieldRef2']['field']]['fields'][TRelation['fieldRef2']['field']]
>

type CreateLinkFunction<
  TFieldRef1DataFormat extends DataFormat,
  TFieldRef2DataFormat extends DataFormat,
  TFieldRef1Field extends Field,
  TFieldRef2Field extends Field,
  TRelation extends Relation<RelationType.MANY_TO_MANY> = Relation<RelationType.MANY_TO_MANY>,
> = (options: CreateJoinTableRecordOptions<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field>) => (
  Promise<JoinTableRecord<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation>>
)

export type _CreateLinkFunction<
  TDataFormats extends DataFormats = DataFormats,
  TRelation extends Relation<RelationType.MANY_TO_MANY> = Relation<RelationType.MANY_TO_MANY>,
> = CreateLinkFunction<
  TDataFormats[TRelation['fieldRef1']['dataFormat']],
  TDataFormats[TRelation['fieldRef2']['dataFormat']],
  TDataFormats[TRelation['fieldRef1']['field']]['fields'][TRelation['fieldRef1']['field']],
  TDataFormats[TRelation['fieldRef2']['field']]['fields'][TRelation['fieldRef2']['field']],
  TRelation
>

type CreateLinksFunction<
  TFieldRef1DataFormat extends DataFormat,
  TFieldRef2DataFormat extends DataFormat,
  TFieldRef1Field extends Field,
  TFieldRef2Field extends Field
> = (options: CreateJoinTableRecordOptions<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field>[]) => (
  Promise<void>
)

export type _CreateLinksFunction<
  TDataFormats extends DataFormats = DataFormats,
  TRelation extends Relation<RelationType.MANY_TO_MANY> = Relation<RelationType.MANY_TO_MANY>,
> = CreateLinksFunction<
  TDataFormats[TRelation['fieldRef1']['dataFormat']],
  TDataFormats[TRelation['fieldRef2']['dataFormat']],
  TDataFormats[TRelation['fieldRef1']['field']]['fields'][TRelation['fieldRef1']['field']],
  TDataFormats[TRelation['fieldRef2']['field']]['fields'][TRelation['fieldRef2']['field']]
>

export type DeleteLinkByIdFunctionOptions = {
  id: number
  return?: boolean
}

type DeleteLinkByIdFunctionResult<
  TFieldRef1DataFormat extends DataFormat,
  TFieldRef2DataFormat extends DataFormat,
  TFieldRef1Field extends Field,
  TFieldRef2Field extends Field,
  TOptions extends DeleteLinkByIdFunctionOptions,
  TRelation extends Relation<RelationType.MANY_TO_MANY> = Relation<RelationType.MANY_TO_MANY>,
> = TOptions extends { return: boolean }
  ? TOptions['return'] extends true
    ? JoinTableRecord<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation> | null
    : boolean
  : boolean

type DeleteLinkByIdFunction<
  TFieldRef1DataFormat extends DataFormat,
  TFieldRef2DataFormat extends DataFormat,
  TFieldRef1Field extends Field,
  TFieldRef2Field extends Field,
  TRelation extends Relation<RelationType.MANY_TO_MANY> = Relation<RelationType.MANY_TO_MANY>,
> = <TOptions extends DeleteLinkByIdFunctionOptions = DeleteLinkByIdFunctionOptions>(
  options: TOptions
) => Promise<
  DeleteLinkByIdFunctionResult<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TOptions, TRelation>
>

export type _DeleteLinkByIdFunction<
  TDataFormats extends DataFormats = DataFormats,
  TRelation extends Relation<RelationType.MANY_TO_MANY> = Relation<RelationType.MANY_TO_MANY>,
> = DeleteLinkByIdFunction<
  TDataFormats[TRelation['fieldRef1']['dataFormat']],
  TDataFormats[TRelation['fieldRef2']['dataFormat']],
  TDataFormats[TRelation['fieldRef1']['field']]['fields'][TRelation['fieldRef1']['field']],
  TDataFormats[TRelation['fieldRef2']['field']]['fields'][TRelation['fieldRef2']['field']]
>

export type DeleteFunctionOptions<
  TFieldRef1DataFormat extends DataFormat,
  TFieldRef2DataFormat extends DataFormat,
  TFieldRef1Field extends Field,
  TFieldRef2Field extends Field,
  TRelation extends Relation<RelationType.MANY_TO_MANY> = Relation<RelationType.MANY_TO_MANY>,
> = {
  /**
   * Data query to select the record(s) to delete.
   */
  query?: DataQueryRecord<
    (keyof JoinTableRecord<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation>) & string
  >
  /**
   * Determines whether the deleted record(s) are to be returned.
   *
   * If `false`, the count of deleted records is returned.
   *
   * This can be alternatively be defined as `'first'`, which will cause
   * only the first record to be returned. This is useful when it is expected
   * that only one record will be deleted.
   *
   * @default false
   */
   return?: ReturnModeRaw
}

export type _DeleteFunctionOptions<
  TDataFormats extends DataFormats = DataFormats,
  TRelation extends Relation<RelationType.MANY_TO_MANY> = Relation<RelationType.MANY_TO_MANY>,
> = DeleteFunctionOptions<
  TDataFormats[TRelation['fieldRef1']['dataFormat']],
  TDataFormats[TRelation['fieldRef2']['dataFormat']],
  TDataFormats[TRelation['fieldRef1']['field']]['fields'][TRelation['fieldRef1']['field']],
  TDataFormats[TRelation['fieldRef2']['field']]['fields'][TRelation['fieldRef2']['field']],
  TRelation
>

export type DeleteFunctionResult<
  TFieldRef1DataFormat extends DataFormat,
  TFieldRef2DataFormat extends DataFormat,
  TFieldRef1Field extends Field,
  TFieldRef2Field extends Field,
  TRelation extends Relation<RelationType.MANY_TO_MANY> = Relation<RelationType.MANY_TO_MANY>,
  TOptions extends DeleteFunctionOptions<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation>
    = DeleteFunctionOptions<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation>,
> = TOptions extends { return: boolean }
? TOptions['return'] extends true
  ? (keyof JoinTableRecord<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation>) & string[] | null
  : number
: TOptions extends { return: string }
  ? TOptions['return'] extends 'first'
    ? (keyof JoinTableRecord<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation>) & string
    : number
  : number

export type _DeleteFunctionResult<
  TDataFormats extends DataFormats = DataFormats,
  TRelation extends Relation<RelationType.MANY_TO_MANY> = Relation<RelationType.MANY_TO_MANY>,
> = DeleteFunctionResult<
  TDataFormats[TRelation['fieldRef1']['dataFormat']],
  TDataFormats[TRelation['fieldRef2']['dataFormat']],
  TDataFormats[TRelation['fieldRef1']['field']]['fields'][TRelation['fieldRef1']['field']],
  TDataFormats[TRelation['fieldRef2']['field']]['fields'][TRelation['fieldRef2']['field']],
  TRelation
>

export type DeleteFunction<
  TFieldRef1DataFormat extends DataFormat,
  TFieldRef2DataFormat extends DataFormat,
  TFieldRef1Field extends Field,
  TFieldRef2Field extends Field,
  TRelation extends Relation<RelationType.MANY_TO_MANY> = Relation<RelationType.MANY_TO_MANY>,
> = <TOptions extends DeleteFunctionOptions<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation>>(
  options?: TOptions,
) => DeleteFunctionResult<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation, TOptions>

export type _DeleteFunction<
  TDataFormats extends DataFormats = DataFormats,
  TRelation extends Relation<RelationType.MANY_TO_MANY> = Relation<RelationType.MANY_TO_MANY>,
> = DeleteFunction<
  TDataFormats[TRelation['fieldRef1']['dataFormat']],
  TDataFormats[TRelation['fieldRef2']['dataFormat']],
  TDataFormats[TRelation['fieldRef1']['field']]['fields'][TRelation['fieldRef1']['field']],
  TDataFormats[TRelation['fieldRef2']['field']]['fields'][TRelation['fieldRef2']['field']],
  TRelation
>

export type _JoinTableStore<
  TFieldRef1DataFormat extends DataFormat,
  TFieldRef2DataFormat extends DataFormat,
  TFieldRef1Field extends Field,
  TFieldRef2Field extends Field,
  TRelation extends Relation<RelationType.MANY_TO_MANY> = Relation<RelationType.MANY_TO_MANY>,
> = {
  create: CreateLinkFunction<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation>
  createMultiple: CreateLinksFunction<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field>
  delete: DeleteFunction<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation>
  deleteById: DeleteLinkByIdFunction<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation>
}

export type JoinTableStore<
  TDataFormats extends DataFormats = DataFormats,
  TRelation extends Relation<RelationType.MANY_TO_MANY> = Relation<RelationType.MANY_TO_MANY>,
> = _JoinTableStore<
  TDataFormats[TRelation['fieldRef1']['dataFormat']],
  TDataFormats[TRelation['fieldRef2']['dataFormat']],
  TDataFormats[TRelation['fieldRef1']['field']]['fields'][TRelation['fieldRef1']['field']],
  TDataFormats[TRelation['fieldRef2']['field']]['fields'][TRelation['fieldRef2']['field']],
  TRelation
>

export type JoinTableStoresDict<
  TDataFormats extends DataFormats = DataFormats,
  TRelations extends Relations = Relations,
> = {
  // @ts-ignore
  [TRelationName in ExtractManyToManyRelationNames<TRelations, TDataFormats>]: JoinTableStore<TDataFormats, TRelations[TRelationName]>
}
