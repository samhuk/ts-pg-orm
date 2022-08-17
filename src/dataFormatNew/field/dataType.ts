import { Field } from './types'

export enum DataType {
  /**
   * Any numeric value, i.e. integer, serial, real.
   */
  NUMBER,
  /**
   * Any string value, i.e. varying length, fixed length, etc.
   */
  STRING,
  /**
   * Any boolean value
   */
  BOOLEAN,
  /**
   * Any epoch value, i.e. time, date, date-time, date-time with timezone.
   */
  DATE,
  /**
   * Any object or array value.
   */
  JSON
}

export enum NumberType {
  INTEGER,
  /**
   * A serial integer value. This is likely to be for the unique primary key field of the data format.
   */
  SERIAL,
  REAL
}

export enum StringType {
  /**
   * A string value that is a UUID V4, i.e. a 36 character randomly-generated string.
   */
  UUID_V4,
  /**
   * A fixed-length string.
   */
  FIXED_LENGTH,
  /**
   * A varying-length string.
   */
  VARYING_LENGTH,
  /**
   * A string that, underlying, is some kind of enumeration.
   */
  STRING_ENUM,
}

export enum BoolType {
  TRUE_FALSE,
}

export enum DateType {
  DATE,
  TIME,
  DATE_TIME,
  DATE_TIME_WITH_TIMEZONE
}

export enum ThreeStepNumberSize {
  SMALL,
  REGULAR,
  LARGE,
}

export enum TwoStepNumberSize {
  REGULAR,
  LARGE,
}

export enum JsonType {
  ARRAY,
  OBJECT
}

export type DataTypeToSubType = {
  [DataType.BOOLEAN]: BoolType,
  [DataType.STRING]: StringType,
  [DataType.NUMBER]: NumberType,
  [DataType.DATE]: DateType,
  [DataType.JSON]: JsonType,
}

type DataTypeToDefaultValueType = {
  [DataType.BOOLEAN]: boolean,
  [DataType.STRING]: string,
  [DataType.NUMBER]: number,
  [DataType.DATE]: string,
  [DataType.JSON]: {
    [JsonType.ARRAY]: any[]
    [JsonType.OBJECT]: any
  },
}

export type FieldToDefaultValueType<T extends Field> =
  T extends { type: DataType.JSON }
    // @ts-ignore
    ? DataTypeToDefaultValueType[T['type']][T['subType']]
    : DataTypeToDefaultValueType[T['type']]

type DataTypeSubTypeSpecificPropsMapping = {
  type: {
    [DataType.NUMBER]: {
      /**
       * Determines whether the number field is a primary key.
       *
       * Default: `true` for SERIAL sub-types, `false` otherwise.
       */
      isPrimaryKey?: boolean
      /**
       * Determines whether the storage of a null value for the number field is allowed.
       *
       * Default: `false`
       */
      subType: {
        [NumberType.INTEGER]: {
          optional?: boolean
          size?: ThreeStepNumberSize
          default?: number
        }
        [NumberType.SERIAL]: {
          size?: ThreeStepNumberSize
        }
        [NumberType.REAL]: {
          optional?: boolean
          size?: TwoStepNumberSize
          default?: number
        }
      }
    }
    [DataType.STRING]: {
      /**
       * Determines whether the string field is a primary key.
       *
       * Default: `false`
       */
      isPrimaryKey?: boolean
      /**
       * Determines whether the storage of a null value for the string field is allowed.
       *
       * Default: `false`.
       */
      optional?: boolean
      /**
       * The default value for the string field.
       *
       * Note 1: If the data type is STRING_ENUM, then you must provide a default value such
       * that the type of the field is known. To achieve this, one can either provide a default value
       * like `default: MyEnum.VALUE` or, if no default is desired, then `default: null as MyEnum`.
       *
       * This will mean that the generated Typescript record type property for the field will have the correct
       * type.
       *
       * Note 2: This is ignored if sub-type is `UUID_V4` and `autoGenerate` is set to `true`.
       *
       * Default: `undefined`
       */
      default?: string
      subType: {
        [StringType.UUID_V4]: {
          /**
           * Determines whether it should default to a randomly-generated UUID V4 value if not provided.
           *
           * Default: `true`
           */
          autoGenerate?: boolean
        }
        [StringType.FIXED_LENGTH]: {
          /**
           * The length of the fixed-length string value.
           */
          length: number
        }
        [StringType.VARYING_LENGTH]: {
          /**
           * The max length (max number of characters) of the string value.
           */
          maxLength: number
        }
        [StringType.STRING_ENUM]: {
          /**
           * Optional max length (max number of characters) of the string value.
           *
           * Default: `100`
           */
          maxLength?: number
        }
      }
    }
    [DataType.DATE]: {
      /**
       * Allow the storage of a null value for the field.
       *
       * Default: `false`
       */
      optional?: boolean
      /**
       * Determines whether the field should default to the current epoch if not provided.
       *
       * This is commonly required if the field is a "dateCreated"-like field.
       *
       * Default: `false`
       */
      defaultToCurrentEpoch?: boolean
      /**
       * The default value for the date field.
       *
       * Note: This is ignored if `defaultToCurrentEpoch` is set to `true`.
       *
       * Default: `undefined`
       */
      default?: string
      subType: {
        [DateType.DATE]: { }
        [DateType.TIME]: { }
        [DateType.DATE_TIME]: { }
        [DateType.DATE_TIME_WITH_TIMEZONE]: { }
      }
    }
    [DataType.BOOLEAN]: {
      /**
       * Allow the storage of a null value for the field.
       *
       * Default: `false`
       */
      optional?: boolean
      /**
       * Default: `undefined`
       */
      default?: boolean
      subType: {
        [BoolType.TRUE_FALSE]: { }
      }
    }
    [DataType.JSON]: {
      /**
       * Allow the storage of a null value for the field.
       *
       * Default: `false`.
       */
      optional?: boolean
      subType: {
        [JsonType.ARRAY]: {
          default?: Readonly<any[]>
        }
        [JsonType.OBJECT]: {
          default?: Readonly<any>
        }
      }
    }
  }
}

type ToDiscrimUnion<T, K extends keyof T> = T extends unknown ? {
  [P in keyof T[K]]: (
    Omit<T, K> & Record<K, P> & T[K][P]
  ) extends infer O ? { [Q in keyof O]: O[Q] } : never }[keyof T[K]
] : never

type DataTypeSubTypeSpecificPropsWithoutGeneric = ToDiscrimUnion<ToDiscrimUnion<DataTypeSubTypeSpecificPropsMapping, 'type'>, 'subType'>

export type DataTypeSubTypeSpecificProps<
  TDataType extends DataType = DataType,
  TDataSubType extends DataTypeToSubType[TDataType] = any,
> = Extract<DataTypeSubTypeSpecificPropsWithoutGeneric, { type: TDataType, subType: TDataSubType }>
