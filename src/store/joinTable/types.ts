import { DataQueryRecord } from '@samhuk/data-query/dist/types'
import { DataFormatDeclarations, DataFormatFieldToRecordPropertyValue } from '../../dataFormat/types'
import { ExpandRecursively } from '../../helpers/types'
import {
  ExtractRelationNamesOfManyToManyRelations,
  Relation,
  RelationDeclaration,
  RelationDeclarations,
  RelationsDict,
  RelationType,
} from '../../relations/types'
import { ReturnModeRaw } from '../common/types'

type JoinTableRecordLinkedFields<
  T extends DataFormatDeclarations,
  TFieldRef1DataFormat extends T[number],
  TFieldRef2DataFormat extends T[number],
  TFieldRef1Field extends T[number]['fields'][number],
  TFieldRef2Field extends T[number]['fields'][number],
> = {
  [fieldRef1FieldName in `${TFieldRef1DataFormat['name']}${Capitalize<TFieldRef1Field['name']>}`]: DataFormatFieldToRecordPropertyValue<TFieldRef1Field>
} & {
  [fieldRef2FieldName in `${TFieldRef2DataFormat['name']}${Capitalize<TFieldRef2Field['name']>}`]: DataFormatFieldToRecordPropertyValue<TFieldRef2Field>
}

type JoinTableRecord<
  T extends DataFormatDeclarations,
  TFieldRef1DataFormat extends T[number],
  TFieldRef2DataFormat extends T[number],
  TFieldRef1Field extends T[number]['fields'][number],
  TFieldRef2Field extends T[number]['fields'][number],
  TRelation extends AnyManyToManyRelation<T> = AnyManyToManyRelation<T>
> = ExpandRecursively<
  JoinTableRecordLinkedFields<T, TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field>
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
  T extends DataFormatDeclarations,
  TFieldRef1DataFormat extends T[number],
  TFieldRef2DataFormat extends T[number],
  TFieldRef1Field extends T[number]['fields'][number],
  TFieldRef2Field extends T[number]['fields'][number],
> = JoinTableRecordLinkedFields<T, TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field>

export type _CreateJoinTableRecordOptions<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  TRelation extends AnyManyToManyRelation<T> = AnyManyToManyRelation<T>,
> = CreateJoinTableRecordOptions<
  T,
  Extract<T[number], { name: TRelation['fieldRef1']['formatName'] }>,
  Extract<T[number], { name: TRelation['fieldRef2']['formatName'] }>,
  Extract<Extract<T[number], { name: TRelation['fieldRef1']['formatName'] }>['fields'][number], { name: TRelation['fieldRef1']['fieldName'] }>,
  Extract<Extract<T[number], { name: TRelation['fieldRef2']['formatName'] }>['fields'][number], { name: TRelation['fieldRef2']['fieldName'] }>
>

type CreateLinkFunction<
  T extends DataFormatDeclarations,
  TFieldRef1DataFormat extends T[number],
  TFieldRef2DataFormat extends T[number],
  TFieldRef1Field extends T[number]['fields'][number],
  TFieldRef2Field extends T[number]['fields'][number],
  TRelation extends AnyManyToManyRelation<T> = AnyManyToManyRelation<T>,
> = (options: CreateJoinTableRecordOptions<T, TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field>) => (
  Promise<JoinTableRecord<T, TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation>>
)

export type _CreateLinkFunction<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  TRelation extends AnyManyToManyRelation<T> = AnyManyToManyRelation<T>,
> = CreateLinkFunction<
  T,
  Extract<T[number], { name: TRelation['fieldRef1']['formatName'] }>,
  Extract<T[number], { name: TRelation['fieldRef2']['formatName'] }>,
  Extract<Extract<T[number], { name: TRelation['fieldRef1']['formatName'] }>['fields'][number], { name: TRelation['fieldRef1']['fieldName'] }>,
  Extract<Extract<T[number], { name: TRelation['fieldRef2']['formatName'] }>['fields'][number], { name: TRelation['fieldRef2']['fieldName'] }>,
  TRelation
>

type CreateLinksFunction<
  T extends DataFormatDeclarations,
  TFieldRef1DataFormat extends T[number],
  TFieldRef2DataFormat extends T[number],
  TFieldRef1Field extends T[number]['fields'][number],
  TFieldRef2Field extends T[number]['fields'][number]
> = (options: CreateJoinTableRecordOptions<T, TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field>[]) => (
  Promise<void>
)

export type _CreateLinksFunction<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  TRelation extends AnyManyToManyRelation<T> = AnyManyToManyRelation<T>,
> = CreateLinksFunction<
  T,
  Extract<T[number], { name: TRelation['fieldRef1']['formatName'] }>,
  Extract<T[number], { name: TRelation['fieldRef2']['formatName'] }>,
  Extract<Extract<T[number], { name: TRelation['fieldRef1']['formatName'] }>['fields'][number], { name: TRelation['fieldRef1']['fieldName'] }>,
  Extract<Extract<T[number], { name: TRelation['fieldRef2']['formatName'] }>['fields'][number], { name: TRelation['fieldRef2']['fieldName'] }>
>

export type DeleteLinkByIdFunctionOptions = {
  id: number
  return?: boolean
}

type DeleteLinkByIdFunctionResult<
  T extends DataFormatDeclarations,
  TFieldRef1DataFormat extends T[number],
  TFieldRef2DataFormat extends T[number],
  TFieldRef1Field extends T[number]['fields'][number],
  TFieldRef2Field extends T[number]['fields'][number],
  TOptions extends DeleteLinkByIdFunctionOptions,
  TRelation extends AnyManyToManyRelation<T> = AnyManyToManyRelation<T>
> = TOptions extends { return: boolean }
  ? TOptions['return'] extends true
    ? JoinTableRecord<T, TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation> | null
    : boolean
  : boolean

type DeleteLinkByIdFunction<
  T extends DataFormatDeclarations,
  TFieldRef1DataFormat extends T[number],
  TFieldRef2DataFormat extends T[number],
  TFieldRef1Field extends T[number]['fields'][number],
  TFieldRef2Field extends T[number]['fields'][number],
  TRelation extends AnyManyToManyRelation<T> = AnyManyToManyRelation<T>
> = <TOptions extends DeleteLinkByIdFunctionOptions = DeleteLinkByIdFunctionOptions>(
  options: TOptions
) => Promise<
  DeleteLinkByIdFunctionResult<T, TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TOptions, TRelation>
>

export type _DeleteLinkByIdFunction<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  TRelation extends AnyManyToManyRelation<T> = AnyManyToManyRelation<T>,
> = DeleteLinkByIdFunction<
  T,
  Extract<T[number], { name: TRelation['fieldRef1']['formatName'] }>,
  Extract<T[number], { name: TRelation['fieldRef2']['formatName'] }>,
  Extract<Extract<T[number], { name: TRelation['fieldRef1']['formatName'] }>['fields'][number], { name: TRelation['fieldRef1']['fieldName'] }>,
  Extract<Extract<T[number], { name: TRelation['fieldRef2']['formatName'] }>['fields'][number], { name: TRelation['fieldRef2']['fieldName'] }>
>

export type DeleteFunctionOptions<
  T extends DataFormatDeclarations,
  TFieldRef1DataFormat extends T[number],
  TFieldRef2DataFormat extends T[number],
  TFieldRef1Field extends T[number]['fields'][number],
  TFieldRef2Field extends T[number]['fields'][number],
  TRelation extends AnyManyToManyRelation<T> = AnyManyToManyRelation<T>
> = {
  /**
   * Data query to select the record(s) to delete.
   */
  query?: DataQueryRecord<
    (keyof JoinTableRecord<T, TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation>) & string
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
  T extends DataFormatDeclarations = DataFormatDeclarations,
  TRelation extends AnyManyToManyRelation<T> = AnyManyToManyRelation<T>,
> = DeleteFunctionOptions<
  T,
  Extract<T[number], { name: TRelation['fieldRef1']['formatName'] }>,
  Extract<T[number], { name: TRelation['fieldRef2']['formatName'] }>,
  Extract<Extract<T[number], { name: TRelation['fieldRef1']['formatName'] }>['fields'][number], { name: TRelation['fieldRef1']['fieldName'] }>,
  Extract<Extract<T[number], { name: TRelation['fieldRef2']['formatName'] }>['fields'][number], { name: TRelation['fieldRef2']['fieldName'] }>,
  TRelation
>

export type DeleteFunctionResult<
  T extends DataFormatDeclarations,
  TFieldRef1DataFormat extends T[number],
  TFieldRef2DataFormat extends T[number],
  TFieldRef1Field extends T[number]['fields'][number],
  TFieldRef2Field extends T[number]['fields'][number],
  TRelation extends AnyManyToManyRelation<T> = AnyManyToManyRelation<T>,
  TOptions extends DeleteFunctionOptions<T, TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation>
    = DeleteFunctionOptions<T, TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation>,
> = TOptions extends { return: boolean }
? TOptions['return'] extends true
  ? (keyof JoinTableRecord<T, TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation>) & string[] | null
  : number
: TOptions extends { return: string }
  ? TOptions['return'] extends 'first'
    ? (keyof JoinTableRecord<T, TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation>) & string
    : number
  : number

export type _DeleteFunctionResult<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  TRelation extends AnyManyToManyRelation<T> = AnyManyToManyRelation<T>,
> = DeleteFunctionResult<
  T,
  Extract<T[number], { name: TRelation['fieldRef1']['formatName'] }>,
  Extract<T[number], { name: TRelation['fieldRef2']['formatName'] }>,
  Extract<Extract<T[number], { name: TRelation['fieldRef1']['formatName'] }>['fields'][number], { name: TRelation['fieldRef1']['fieldName'] }>,
  Extract<Extract<T[number], { name: TRelation['fieldRef2']['formatName'] }>['fields'][number], { name: TRelation['fieldRef2']['fieldName'] }>,
  TRelation
>

export type DeleteFunction<
  T extends DataFormatDeclarations,
  TFieldRef1DataFormat extends T[number],
  TFieldRef2DataFormat extends T[number],
  TFieldRef1Field extends T[number]['fields'][number],
  TFieldRef2Field extends T[number]['fields'][number],
  TRelation extends AnyManyToManyRelation<T> = AnyManyToManyRelation<T>,
> = <TOptions extends DeleteFunctionOptions<T, TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation>>(
  options?: TOptions,
) => DeleteFunctionResult<T, TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation, TOptions>

export type _DeleteFunction<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  TRelation extends AnyManyToManyRelation<T> = AnyManyToManyRelation<T>,
> = DeleteFunction<
  T,
  Extract<T[number], { name: TRelation['fieldRef1']['formatName'] }>,
  Extract<T[number], { name: TRelation['fieldRef2']['formatName'] }>,
  Extract<Extract<T[number], { name: TRelation['fieldRef1']['formatName'] }>['fields'][number], { name: TRelation['fieldRef1']['fieldName'] }>,
  Extract<Extract<T[number], { name: TRelation['fieldRef2']['formatName'] }>['fields'][number], { name: TRelation['fieldRef2']['fieldName'] }>,
  TRelation
>

export type _JoinTableStore<
  T extends DataFormatDeclarations,
  TFieldRef1DataFormat extends T[number],
  TFieldRef2DataFormat extends T[number],
  TFieldRef1Field extends T[number]['fields'][number],
  TFieldRef2Field extends T[number]['fields'][number],
  TRelation extends AnyManyToManyRelation<T> = AnyManyToManyRelation<T>,
> = {
  provision: () => Promise<void>
  unprovision: () => Promise<void>
  create: CreateLinkFunction<T, TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation>
  createMultiple: CreateLinksFunction<T, TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field>
  delete: DeleteFunction<T, TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation>
  deleteById: DeleteLinkByIdFunction<T, TFieldRef1DataFormat, TFieldRef2DataFormat, TFieldRef1Field, TFieldRef2Field, TRelation>
}

type AnyManyToManyRelation<T extends DataFormatDeclarations> =
  Relation<T, RelationType.MANY_TO_MANY, RelationDeclaration<T, RelationType.MANY_TO_MANY>>

export type JoinTableStore<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  TRelation extends AnyManyToManyRelation<T> = AnyManyToManyRelation<T>,
> = _JoinTableStore<
  T,
  Extract<T[number], { name: TRelation['fieldRef1']['formatName'] }>,
  Extract<T[number], { name: TRelation['fieldRef2']['formatName'] }>,
  Extract<Extract<T[number], { name: TRelation['fieldRef1']['formatName'] }>['fields'][number], { name: TRelation['fieldRef1']['fieldName'] }>,
  Extract<Extract<T[number], { name: TRelation['fieldRef2']['formatName'] }>['fields'][number], { name: TRelation['fieldRef2']['fieldName'] }>,
  TRelation
>

export type JoinTableStoresDict<
  T extends DataFormatDeclarations = DataFormatDeclarations,
  K extends RelationDeclarations<T> = RelationDeclarations<T>,
> = {
  // @ts-ignore
  [TRelationName in ExtractRelationNamesOfManyToManyRelations<K>]: JoinTableStore<T, RelationsDict<T, K>[TRelationName]>
}
