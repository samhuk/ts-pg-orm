import { DataType, DataTypeSubTypeSpecificProps, DataTypeToSubType, FieldToDefaultValueType, JsonType, StringType } from './dataType'

export type FieldOptions<
  TDataType extends DataType = DataType,
  TDataSubType extends DataTypeToSubType[TDataType] = DataTypeToSubType[TDataType],
> = {
  displayName?: string
  colName?: string
} & DataTypeSubTypeSpecificProps<TDataType, TDataSubType>

export type FieldOptionsDict = { [TFieldName: string]: FieldOptions }

export type Field<
    TDataType extends DataType = DataType,
    TDataSubType extends DataTypeToSubType[TDataType] = DataTypeToSubType[TDataType],
    TName extends string = string,
    TFieldOptions extends FieldOptions<TDataType, TDataSubType> = FieldOptions<TDataType, TDataSubType>,
> = Omit<TFieldOptions, 'displayName'> & {
    name: TName
    capitalizedName: Capitalize<TName>
    // @ts-ignore
    displayName: TFieldOptions extends { displayName: string } ? TFieldOptions['displayName'] : Capitalize<TName>
    // @ts-ignore
    colName: TFieldOptions extends { colName: string } ? TFieldOptions['colName'] : string
}

export type Fields<TFieldOptionsDict extends FieldOptionsDict = FieldOptionsDict> = {
  [TFieldName in keyof TFieldOptionsDict]:
    Field<DataType, DataTypeToSubType[DataType], TFieldName & string, TFieldOptionsDict[TFieldName]>
}

export type FieldToRecordType<K extends Field> = (
  // If field is json
  K extends Field<DataType.JSON>
    // If field is json array
    ? (K extends Field<DataType.JSON, JsonType.ARRAY>
      // If default is specified
      ? (K extends { default: any[] }
        // Use default's type
        ? K['default']
        // Else, any array
        : any[]
      )
      // Else, if field is json object
      : (K extends Field<DataType.JSON, JsonType.OBJECT>
        // If default is specified
        ? (K extends { default: any }
          // Use default's type
          ? K['default']
          // Else, any
          : any
        )
        //
        : any
      )
    )
    // Else (not json field), if field is string enum
    : (K extends Field<DataType.STRING, StringType.STRING_ENUM>
      // If default is specified
      ? (K extends { default: string }
        // Use default's type (should be an enum)
        ? K['default']
        // Else, string
        : string
      )
      // Else (every other field), use default type for field
      : FieldToDefaultValueType<K>
    )
)
