import { ValuesUnionFromDict } from '../../helpers/types'
import { FieldsOptions, Fields } from './types/field'
import { FieldSubSets, FieldSubSetsOptions } from './types/fieldSubSet'

export type DataFormat<
  TName extends string = string,
  TFieldsOptions extends FieldsOptions = FieldsOptions,
  TFieldSubSetsOptions extends FieldSubSetsOptions<(keyof TFieldsOptions) & string> = FieldSubSetsOptions<(keyof TFieldsOptions) & string>,
> = {
  name: TName
  fields: Fields<TFieldsOptions>
  fieldList: ValuesUnionFromDict<Fields<TFieldsOptions>>
  fieldNameList: ValuesUnionFromDict<Fields<TFieldsOptions>>['name']
  fieldSubSets: FieldSubSets<(keyof TFieldsOptions) & string, TFieldSubSetsOptions>
  setFields: <TNewFieldsOptions extends FieldsOptions>(
    newFieldsOptions: TNewFieldsOptions
  ) => DataFormat<TName, TNewFieldsOptions, TFieldSubSetsOptions>
  // TODO: Figure out how to properly do this
  // setFieldSubSets: <TNewFieldSubSetsOptions extends FieldSubSetsOptions<(keyof TFieldsOptions) & string>>(
  //   newFieldSubSetsOptions: TNewFieldSubSetsOptions
  // ) => DataFormat<TName, TFieldsOptions, TNewFieldSubSetsOptions>
}
