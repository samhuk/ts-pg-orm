import { StringKeysOf } from '../../helpers/types'

type FieldSubSetOptions<FieldNames extends string = string> = {
  fields: FieldNames[]
}

type FieldSubSet<
  TName extends string,
  TFieldNames extends string,
  TFieldSubSetOptions extends FieldSubSetOptions<TFieldNames>
> = {
  name: TName
  fields: TFieldSubSetOptions[]
}

export type FieldSubSetsOptions<
  TFieldNames extends string,
> = { [name: string]: FieldSubSetOptions<TFieldNames> }

export type FieldSubSets<
  TFieldNames extends string,
  TFieldSubSetsOptions extends FieldSubSetsOptions<TFieldNames>
> = {
  [TFieldSubSetName in StringKeysOf<TFieldSubSetsOptions>]: FieldSubSet<TFieldSubSetName, TFieldNames, TFieldSubSetsOptions[TFieldSubSetName]>
}
