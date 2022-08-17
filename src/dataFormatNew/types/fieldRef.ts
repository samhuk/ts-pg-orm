import { DataFormatOptions } from '.'

export type FieldRef<
  TDataFormatName extends string,
  TFieldName extends string
> = {
  formatName: TDataFormatName
  fieldName: TFieldName
}

export type FieldRefs<
  TDataOptionsOptions extends DataFormatOptions = DataFormatOptions
> = { [TFieldName in keyof TDataOptionsOptions['fields']]:
  FieldRef<TDataOptionsOptions['name'], TFieldName & string>
}
