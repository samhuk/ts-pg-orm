import { DataFormatList, DataFormatOptions, DataFormatsFromOptions } from '.'
import { ExpandRecursively, ValuesUnionFromDict } from '../../helpers/types'

export type FieldRef<
  TDataFormatName extends string = string,
  TFieldName extends string = string,
> = {
  formatName: TDataFormatName
  fieldName: TFieldName
}

export type FieldRefs<
  TDataOptionsOptions extends DataFormatOptions = DataFormatOptions
> = { [TFieldName in keyof TDataOptionsOptions['fields']]:
  FieldRef<TDataOptionsOptions['name'], TFieldName & string>
}

export type AvailableFieldRefs<
  TDataFormatList extends DataFormatList,
  TDataFormatsFromOptions extends DataFormatsFromOptions<TDataFormatList>
> = ExpandRecursively<ValuesUnionFromDict<{
  [TDataFormatName in keyof TDataFormatsFromOptions]:
    ValuesUnionFromDict<
      TDataFormatsFromOptions[TDataFormatName] extends { fieldRefs: FieldRefs }
        ? TDataFormatsFromOptions[TDataFormatName]['fieldRefs']
        : never
    >
}>>
