import { DataQueryRecord } from '@samhuk/data-query/dist/types'
import { Access, Cast, ExpandRecursively, StringKeysOf } from '../../helpers/types'
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

type _CreateJoinTableRecordOptions<
  TFieldRef1DataFormat extends DataFormat,
  TFieldRef2DataFormat extends DataFormat,
  TFieldRef1Field extends Field,
  TFieldRef2Field extends Field,
> = JoinTableRecordLinkedFields<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field>

export type CreateJoinTableRecordOptions<
  TDataFormats extends DataFormats = DataFormats,
  TRelation extends Relation<RelationType.MANY_TO_MANY> = Relation<RelationType.MANY_TO_MANY>,
> = _CreateJoinTableRecordOptions<
  TDataFormats[TRelation['fieldRef1']['dataFormat']],
  TDataFormats[TRelation['fieldRef2']['dataFormat']],
  TDataFormats[TRelation['fieldRef1']['field']]['fields'][TRelation['fieldRef1']['field']],
  TDataFormats[TRelation['fieldRef2']['field']]['fields'][TRelation['fieldRef2']['field']]
>

type _CreateLinkFunction<
  TFieldRef1DataFormat extends DataFormat,
  TFieldRef2DataFormat extends DataFormat,
  TFieldRef1Field extends Field,
  TFieldRef2Field extends Field,
  TRelation extends Relation<RelationType.MANY_TO_MANY> = Relation<RelationType.MANY_TO_MANY>,
> = (options: _CreateJoinTableRecordOptions<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field>) => (
  Promise<JoinTableRecord<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation>>
)

export type CreateLinkFunction<
  TDataFormats extends DataFormats = DataFormats,
  TRelation extends Relation<RelationType.MANY_TO_MANY> = Relation<RelationType.MANY_TO_MANY>,
> = _CreateLinkFunction<
  TDataFormats[TRelation['fieldRef1']['dataFormat']],
  TDataFormats[TRelation['fieldRef2']['dataFormat']],
  TDataFormats[TRelation['fieldRef1']['field']]['fields'][TRelation['fieldRef1']['field']],
  TDataFormats[TRelation['fieldRef2']['field']]['fields'][TRelation['fieldRef2']['field']],
  TRelation
>

type _CreateLinksFunction<
  TFieldRef1DataFormat extends DataFormat,
  TFieldRef2DataFormat extends DataFormat,
  TFieldRef1Field extends Field,
  TFieldRef2Field extends Field
> = (options: _CreateJoinTableRecordOptions<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field>[]) => (
  Promise<void>
)

export type CreateLinksFunction<
  TDataFormats extends DataFormats = DataFormats,
  TRelation extends Relation<RelationType.MANY_TO_MANY> = Relation<RelationType.MANY_TO_MANY>,
> = _CreateLinksFunction<
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

type _DeleteLinkByIdFunction<
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

export type DeleteLinkByIdFunction<
  TDataFormats extends DataFormats = DataFormats,
  TRelation extends Relation<RelationType.MANY_TO_MANY> = Relation<RelationType.MANY_TO_MANY>,
> = _DeleteLinkByIdFunction<
  TDataFormats[TRelation['fieldRef1']['dataFormat']],
  TDataFormats[TRelation['fieldRef2']['dataFormat']],
  TDataFormats[TRelation['fieldRef1']['field']]['fields'][TRelation['fieldRef1']['field']],
  TDataFormats[TRelation['fieldRef2']['field']]['fields'][TRelation['fieldRef2']['field']]
>

export type _DeleteFunctionOptions<
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
    StringKeysOf<JoinTableRecord<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation>>
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

export type DeleteFunctionOptions<
  TDataFormats extends DataFormats = DataFormats,
  TRelation extends Relation<RelationType.MANY_TO_MANY> = Relation<RelationType.MANY_TO_MANY>,
> = _DeleteFunctionOptions<
  TDataFormats[TRelation['fieldRef1']['dataFormat']],
  TDataFormats[TRelation['fieldRef2']['dataFormat']],
  TDataFormats[TRelation['fieldRef1']['field']]['fields'][TRelation['fieldRef1']['field']],
  TDataFormats[TRelation['fieldRef2']['field']]['fields'][TRelation['fieldRef2']['field']],
  TRelation
>

export type _DeleteFunctionResult<
  TFieldRef1DataFormat extends DataFormat,
  TFieldRef2DataFormat extends DataFormat,
  TFieldRef1Field extends Field,
  TFieldRef2Field extends Field,
  TRelation extends Relation<RelationType.MANY_TO_MANY> = Relation<RelationType.MANY_TO_MANY>,
  TOptions extends _DeleteFunctionOptions<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation>
    = _DeleteFunctionOptions<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation>,
> = TOptions extends { return: boolean }
? TOptions['return'] extends true
  ? (keyof JoinTableRecord<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation>) | null
  : number
: TOptions extends { return: string }
  ? TOptions['return'] extends 'first'
    ? (keyof JoinTableRecord<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation>)
    : number
  : number

export type DeleteFunctionResult<
  TDataFormats extends DataFormats = DataFormats,
  TRelation extends Relation<RelationType.MANY_TO_MANY> = Relation<RelationType.MANY_TO_MANY>,
> = _DeleteFunctionResult<
  TDataFormats[TRelation['fieldRef1']['dataFormat']],
  TDataFormats[TRelation['fieldRef2']['dataFormat']],
  TDataFormats[TRelation['fieldRef1']['field']]['fields'][TRelation['fieldRef1']['field']],
  TDataFormats[TRelation['fieldRef2']['field']]['fields'][TRelation['fieldRef2']['field']],
  TRelation
>

export type _DeleteFunction<
  TFieldRef1DataFormat extends DataFormat,
  TFieldRef2DataFormat extends DataFormat,
  TFieldRef1Field extends Field,
  TFieldRef2Field extends Field,
  TRelation extends Relation<RelationType.MANY_TO_MANY> = Relation<RelationType.MANY_TO_MANY>,
> = <TOptions extends _DeleteFunctionOptions<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation>>(
  options?: TOptions,
) => _DeleteFunctionResult<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation, TOptions>

export type DeleteFunction<
  TDataFormats extends DataFormats = DataFormats,
  TRelation extends Relation<RelationType.MANY_TO_MANY> = Relation<RelationType.MANY_TO_MANY>,
> = _DeleteFunction<
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
  create: _CreateLinkFunction<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation>
  createMultiple: _CreateLinksFunction<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field>
  delete: _DeleteFunction<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation>
  deleteById: _DeleteLinkByIdFunction<TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation>
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
  [TRelationName in ExtractManyToManyRelationNames<TRelations, TDataFormats>]:
    JoinTableStore<TDataFormats, Cast<Access<TRelations, TRelationName>, Relation<RelationType.MANY_TO_MANY>>>
}
