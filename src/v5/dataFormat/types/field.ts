import { TypeDependantBaseIntersection, ValuesUnionFromDict } from '../../../helpers/types'
import {
  DataType,
  DataTypeToDefaultValueType,
  DataTypeToSubType,
  JsonSubType,
  NumSubType,
  StrSubType,
  ThreeStepNumberSize,
  TwoStepNumberSize,
} from './dataType'

type FieldToDefaultValueType<TField extends Field> = TField extends { type: DataType.JSON }
  ? TField extends Field<DataType.JSON>
    ? {
      [JsonSubType.ARRAY]: any[]
      [JsonSubType.OBJECT]: any[]
    }[TField['subType']]
    : never
  : DataTypeToDefaultValueType[TField['type']]

type DataTypeToOptions<
  TSubType extends ValuesUnionFromDict<DataTypeToSubType> = ValuesUnionFromDict<DataTypeToSubType>
> = {
  // -- Str
  [DataType.STR]: TypeDependantBaseIntersection<StrSubType, {
    [StrSubType.FIXED_LENGTH]: {
      len: number
      default?: string
    }
    [StrSubType.VAR_LENGTH]: {
      maxLen: number
      default?: string
    }
    [StrSubType.UUID_V4]: {
      autoGenerate?: boolean
      default?: string
    }
    [StrSubType.ENUM]: {
      len?: number
      default?: string
    }
  }, TSubType, 'subType'> & {
    allowNull?: boolean
  }
  // -- Num
  [DataType.NUM]: TypeDependantBaseIntersection<NumSubType, {
    [NumSubType.INT]: {
      allowNull?: boolean
      size?: ThreeStepNumberSize
      default?: number
    }
    [NumSubType.INT_ENUM]: {
      allowNull?: boolean
      default?: number
    }
    [NumSubType.SERIAL]: {
      size?: ThreeStepNumberSize
    }
    [NumSubType.REAL]: {
      allowNull?: boolean
      size?: TwoStepNumberSize
      default?: number
    }
  }, TSubType, 'subType'>
  // -- Bool
  [DataType.BOOL]: {
    allowNull?: boolean
    default?: boolean
  }
  // -- Epoch
  [DataType.EPOCH]: {
    allowNull?: boolean
    subType: TSubType
    default?: string
    defaultToCurrentEpoch?: boolean
  }
  // -- JSON
  [DataType.JSON]: TypeDependantBaseIntersection<JsonSubType, {
    [JsonSubType.ARRAY]: {
      default?: any[]
    }
    [JsonSubType.OBJECT]: {
      default: any
    }
  }, TSubType, 'subType'> & {
    allowNull?: boolean
  }
}

export type FieldOptions<
  TDataType extends DataType = DataType,
  TSubType extends DataTypeToSubType[TDataType] = DataTypeToSubType[TDataType],
> = TypeDependantBaseIntersection<DataType, DataTypeToOptions<TSubType>, TDataType> & {
  /**
   * Overrides the default inclusion or exclusion of a data format field from the
   * create options. This is useful for fields that don't require an initial value
   * when being created, for example a `dateDeleted` field.
   */
  excludeFromCreateOptions?: boolean
  /**
   * Overrides the default column name for the field.
   */
  columnName?: string
}

export type FieldSql = {
  columnName: string
  unquotedColumnName: string
}

export type Field<
  TDataType extends DataType = DataType,
  TSubType extends DataTypeToSubType[TDataType] = DataTypeToSubType[TDataType],
  TFieldOptions extends FieldOptions<TDataType, TSubType> = FieldOptions<TDataType, TSubType>,
  TName extends string = string,
> = TFieldOptions & {
  name: TName
  sql: FieldSql
}

export type FieldsOptions = { [name: string]: FieldOptions }

export type Fields<TFieldsOptions extends FieldsOptions = FieldsOptions> = {
  [TFieldName in keyof TFieldsOptions]: Field<
    TFieldsOptions[TFieldName]['type'],
    // @ts-ignore
    TFieldsOptions[TFieldName] extends FieldOptions<DataType.NUM | DataType.EPOCH | DataType.STR | DataType.JSON>
      ? TFieldsOptions[TFieldName]['subType']
      : undefined,
    TFieldsOptions[TFieldName],
    TFieldName & string
  >
}

export type FieldToRecordType<TField extends Field> =
  // If field is json array
  TField extends { type: DataType.JSON, subType: JsonSubType.ARRAY }
    // If default is specified
    ? TField extends { default: any[] }
      // Use default's type
      ? TField['default']
      // Else, any array
      : any[]
    // Else, if field is json object
    : TField extends { type: DataType.JSON, subType: JsonSubType.OBJECT }
      // If default is specified
      ? TField extends { default: any }
        // Use default's type
        ? TField['default']
        // Else, any
        : any
      // Else, if field is string enum
      : TField extends { type: DataType.STR, subType: StrSubType.ENUM }
        // If default is specified
        ? TField extends { default: string }
          // Use default's type (should be an enum)
          ? TField['default']
          // Else, string
          : string
        // Else, if field is int enum
        : TField extends { type: DataType.NUM, subType: NumSubType.INT_ENUM }
          // If default is specified
          ? TField extends { default: number }
            // Use default's type (should be an enum)
            ? TField['default']
            // Else, number
            : number
          // Else (every other field), use default type for field
          : FieldToDefaultValueType<TField>
