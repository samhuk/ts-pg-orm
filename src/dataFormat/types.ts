import { DeepReadonly, Mutable, ExpandOneLevel, PickAny, DeepReadonlyOrMutable } from '../helpers/types'
import { Relation, RelationType } from '../relations/types'
import { COMMON_FIELDS } from './common'

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

export enum NumberDataSubType {
  INTEGER,
  /**
   * A serial integer value. This is likely to be for the unique primary key field of the data format.
   */
  SERIAL,
  REAL
}

export enum StringDataSubType {
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

export enum BooleanDataSubType {
  TRUE_FALSE,
}

export enum DateDataSubType {
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

export enum JsonDataSubType {
  ARRAY,
  OBJECT
}

export type DataTypeToSubType = {
  [DataType.BOOLEAN]: BooleanDataSubType,
  [DataType.STRING]: StringDataSubType,
  [DataType.NUMBER]: NumberDataSubType,
  [DataType.DATE]: DateDataSubType,
  [DataType.JSON]: JsonDataSubType,
}

type DataTypeToValueTypeMapping = {
  [DataType.BOOLEAN]: boolean,
  [DataType.STRING]: string,
  [DataType.NUMBER]: number,
  [DataType.DATE]: string,
  [DataType.JSON]: {
    [JsonDataSubType.ARRAY]: any[]
    [JsonDataSubType.OBJECT]: any
  },
}

export type DataFormatFieldToValueType<T extends DataFormatField> =
  T extends { dataType: DataType.JSON }
    ? DataTypeToValueTypeMapping[T['dataType']][T['dataSubType']]
    : DataTypeToValueTypeMapping[T['dataType']]

type DataTypeSubTypeMapping = {
  dataType: {
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
      dataSubType: {
        [NumberDataSubType.INTEGER]: {
          allowNull?: boolean
          size?: ThreeStepNumberSize
          default?: number
        }
        [NumberDataSubType.SERIAL]: {
          size?: ThreeStepNumberSize
        }
        [NumberDataSubType.REAL]: {
          allowNull?: boolean
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
      allowNull?: boolean
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
      dataSubType: {
        [StringDataSubType.UUID_V4]: {
          /**
           * Determines whether it should default to a randomly-generated UUID V4 value if not provided.
           *
           * Default: `true`
           */
          autoGenerate?: boolean
        }
        [StringDataSubType.FIXED_LENGTH]: {
          /**
           * The length of the fixed-length string value.
           */
          length: number
        }
        [StringDataSubType.VARYING_LENGTH]: {
          /**
           * The max length (max number of characters) of the string value.
           */
          maxLength: number
        }
        [StringDataSubType.STRING_ENUM]: {
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
      allowNull?: boolean
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
      dataSubType: {
        [DateDataSubType.DATE]: { }
        [DateDataSubType.TIME]: { }
        [DateDataSubType.DATE_TIME]: { }
        [DateDataSubType.DATE_TIME_WITH_TIMEZONE]: { }
      }
    }
    [DataType.BOOLEAN]: {
      /**
       * Allow the storage of a null value for the field.
       *
       * Default: `false`
       */
      allowNull?: boolean
      /**
       * Default: `undefined`
       */
      default?: boolean
      dataSubType: {
        [BooleanDataSubType.TRUE_FALSE]: { }
      }
    }
    [DataType.JSON]: {
      /**
       * Allow the storage of a null value for the field.
       *
       * Default: `false`.
       */
      allowNull?: boolean
      dataSubType: {
        [JsonDataSubType.ARRAY]: {
          default?: Readonly<any[]>
        }
        [JsonDataSubType.OBJECT]: {
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

type DataFormatFieldBase = {
  displayName?: string
  /**
   * Determines whether the field will be available to get records from
   * entity stores by, i.e. if field is "id" and `enableGetBy` is `true`,
   * then stores will have `getById(id: number)` present.
   */
  enableGetBy?: boolean
  /**
   * Determines whether the field will be available to delete records from
   * entity stores by, i.e. if field is "id" and `enableDeleteBy` is `true`,
   * then stores will have `deleteById(id: number)` present.
   */
   enableDeleteBy?: boolean
}

type DataFormatFieldWithoutGeneric = DataFormatFieldBase & ToDiscrimUnion<ToDiscrimUnion<DataTypeSubTypeMapping, 'dataType'>, 'dataSubType'>

export type FieldSubSet<
  T extends readonly DataFormatField[]
> = {
  name: string
  fields: T[number]['name'][]
}

export type ExtractFieldSubSetNames<T extends DataFormatDeclaration> = T['fieldSubSets'][number]['name']

export type ExtractFieldNamesWithGetBy<T extends DataFormatDeclaration> =
  Extract<T['fields'][number], { enableGetBy: true }>['name']

export type ExtractFieldNamesWithDeleteBy<T extends DataFormatDeclaration> =
  Extract<T['fields'][number], { enableDeleteBy: true }>['name']

export type CapitalizedFieldNames<T extends DataFormatDeclaration> =
  { [TFieldName in ExtractDataFormatFieldNames<T>]: Capitalize<TFieldName> }

type ExtractFieldSubSetFieldNames<
  T extends DataFormatDeclaration,
  K extends ExtractFieldSubSetNames<T>,
> = Extract<T['fieldSubSets'][number], { name: K }>['fields'][number]

export type ToFieldSubSetRecord<
  T extends DataFormatDeclaration,
  K extends ExtractFieldSubSetNames<T>,
> = PickAny<ToRecord<T>, ExtractFieldSubSetFieldNames<T, K>>

export type ExtractFieldSubSet<
  T extends DataFormatDeclaration,
  TName extends ExtractFieldSubSetNames<T>,
> = Extract<T['fieldSubSets'][number], { name: TName }>

export type FieldSubSetsSelectSqlBaseDict<
  T extends DataFormatDeclaration,
> = {
  [K1 in keyof T['fieldSubSets'] & `${bigint}` as T['fieldSubSets'][K1] extends infer TFieldSubSet
    ? TFieldSubSet extends FieldSubSet<T['fields']> ? TFieldSubSet['name'] : never
    : never
  ]: string
}

export type DataFormatField<
  TDataType extends DataType = DataType,
  TDataSubType extends DataTypeToSubType[TDataType] = any,
  TName extends string = string,
> = Extract<DataFormatFieldWithoutGeneric, { dataType: TDataType, dataSubType: TDataSubType }> & { name: TName }

/**
 * Declares a data format. A data format details the list of fields of a particular entity
 * within the application.
 */
export type MutableDataFormatDeclaration<T extends readonly DataFormatField[] = readonly DataFormatField[]> = {
  /**
   * The camel-case, singular name of the format, e.g. "user", "userGroup", "recipe", etc.
   *
   * This will determine things like the table name for postgresql tables and the property
   * names of certain returned data from store functions.
   */
  name: string
  /**
   * The camel-case, pluralized name of the format, e.g. "users", "userGroups", "recipes", etc.
   *
   * This will determine things like the property names of certain returned data from store functions.
   *
   * Default: `name` with "s" suffix.
   */
  pluralizedName?: string
  /**
   * Optional display name. Default: Title-case version of `name`, e.g. "User", "User Group", "Recipe".
   */
  displayName?: string
  /**
   * The list of fields within the data format.
   */
  fields: T
  /**
   * A list of named sub-sets of fields.
   *
   * These are used later on to provide convenient selecting store functions
   * to retreive data with a sub-set of fields of the data format.
   */
  fieldSubSets?: FieldSubSet<T>[]
}

export type DataFormatDeclaration = DeepReadonly<MutableDataFormatDeclaration>

export type DataFormatDeclarations = Readonly<DataFormatDeclaration[]>

export type ExtractDataFormatFieldNames<T extends DataFormatDeclaration> = T['fields'][number]['name']

// -- Data format declaration to record typing system

/**
 * Converts the given data format field to the type of it's value
 */
export type DataFormatFieldToRecordPropertyValue<K extends DataFormatField> = (
  // If field is json
  K extends DataFormatField<DataType.JSON>
    // If field is json array
    ? (K extends DataFormatField<DataType.JSON, JsonDataSubType.ARRAY>
      // If default is specified
      ? (K extends { default: any[] }
        // Use default's type
        ? Mutable<K['default']>
        // Else, any array
        : any[]
      )
      // Else, if field is json object
      : (K extends DataFormatField<DataType.JSON, JsonDataSubType.OBJECT>
        // If default is specified
        ? (K extends { default: any }
          // Use default's type
          ? Mutable<K['default']>
          // Else, any
          : any
        )
        //
        : any
      )
    )
    // Else (not json field), if field is string enum
    : (K extends DataFormatField<DataType.STRING, StringDataSubType.STRING_ENUM>
      // If default is specified
      ? (K extends { default: string }
        // Use default's type (should be an enum)
        ? Mutable<K['default']>
        // Else, string
        : string
      )
      // Else (every other field), use default type for field
      : DataFormatFieldToValueType<K>
    )
)

/**
 * Extracts the field names where `allowNull` is explicitly true.
 */
type ExtractExplicitAllowNullTrueFieldNames<T extends DataFormatDeclaration> = Extract<T['fields'][number], { allowNull: true }>['name']

/**
 * Extracts the field names where `allowNull` is explicitly false.
 */
type ExtractExplicitAllowNullFalseFieldNames<T extends DataFormatDeclaration> = Extract<T['fields'][number], { allowNull: false }>['name']

/**
 * Extracts the field names where `allowNull` is some kind of boolean.
 */
type ExtractExplicitAllowNullBooleanFieldNames<T extends DataFormatDeclaration> = Extract<T['fields'][number], { allowNull: boolean }>['name']

/**
 * Extracts the field names where `allowNull` is explicitly unprovided (and therefore is not part of the field type).
 */
type ExtractExplicitAllowNullUnprovidedFieldNames<T extends DataFormatDeclaration> = Exclude<
  ExtractDataFormatFieldNames<T>,
  ExtractExplicitAllowNullBooleanFieldNames<T>
>

/**
 * Extracts the field names where `allowNull` is a boolean (provided somehow) but is not specifically true or false.
 */
type ExtractAmbiguousAllowNullBooleanFieldNames<T extends DataFormatDeclaration> = Exclude<
  ExtractExplicitAllowNullBooleanFieldNames<T>,
  ExtractExplicitAllowNullTrueFieldNames<T> | ExtractExplicitAllowNullFalseFieldNames<T>
>

/**
 * Extracts the field names that should be optional in the record for the given data format declaration.
 */
type ExtractOptionalRecordFieldNames<T extends DataFormatDeclaration> =
  ExtractExplicitAllowNullFalseFieldNames<T>
  | ExtractExplicitAllowNullUnprovidedFieldNames<T>
  | ExtractAmbiguousAllowNullBooleanFieldNames<T>

/**
 * Converts the given data format declaration to a record - i.e. a type
 * that reflects a hypothetical "row" of the data of the data format.
 */
export type ToRecord<T extends DataFormatDeclaration> = ExpandOneLevel<
  {
    [K in T['fields'][number] as K['name'] extends ExtractExplicitAllowNullTrueFieldNames<T> ? K['name'] : never]?:
      DataFormatFieldToRecordPropertyValue<K>
  }
  & {
    [K in T['fields'][number] as K['name'] extends ExtractOptionalRecordFieldNames<T> ? K['name'] : never]:
      DataFormatFieldToRecordPropertyValue<K>
  }
>

export type FieldRef<
  TFormatName extends string = string,
  TFieldName extends string = string,
> = { formatName: TFormatName, fieldName: TFieldName }

export type FieldRefsDict<T extends DataFormatDeclaration> =
  { [fieldName in ExtractDataFormatFieldNames<T>]: FieldRef<T['name'], fieldName> }

/**
 * Extracts the field names from the given data format declaration that
 * are not auto-generated in some fashion, i.e. dateCreated fields, id fields,
 * uuid fields, and so on.
 */
export type ExtractAutoGeneratedFieldNames<T extends DataFormatDeclaration> = (
  // Exclude datetime fields that default to current epoch
  Extract<T['fields'][number], { dataType: DataType.DATE, defaultToCurrentEpoch: true }>['name']
  // Exclude serial number fields (i.e. typically "id")
  | Extract<T['fields'][number], { dataType: DataType.NUMBER, dataSubType: NumberDataSubType.SERIAL }>['name']
  // Exclude string fields that default to an auto-generated uuid (i.e. v4uuid)
  | Exclude<Extract<T['fields'][number], { dataType: DataType.STRING, dataSubType: StringDataSubType.UUID_V4 }>, { autoGenerate: false }>['name']
)

/**
 * Extracts the field names from the given data format declaration that
 * are auto-generated in some fashion, i.e. dateCreated fields, id fields,
 * uuid fields, and so on.
 */
export type ExtractNonAutoGeneratedFieldNames<T extends DataFormatDeclaration> =
  Exclude<
    T['fields'][number]['name'],
    ExtractAutoGeneratedFieldNames<T>
  >

/**
 * Extracts the field names from the given data format declaration that
 * have a defined default value.
 */
export type ExtractFieldNamesWithDefaults<T extends DataFormatDeclaration> =
  Extract<T['fields'][number], { default: any }>['name']

export type CreateRecordFieldNames<T extends DataFormatDeclaration> = (keyof CreateRecordOptions<T>)[]

/**
 * Creates a type that can be used to create a record for the given data format declaration.
 *
 * Basically, this takes fields out of the standard record type that are auto-generated, and
 * makes fields with defaults optional.
 */
export type CreateRecordOptions<T extends DataFormatDeclaration> =
  // Pick the fields from the full record that are required
  Omit<
    // Pick the fields from the full record that don't have auto-generated fields
    PickAny<
      ToRecord<T>,
      ExtractNonAutoGeneratedFieldNames<T>
    >,
    // From the fields that aren't auto-generated, omit dateDeleted as a special case
    ExtractFieldNamesWithDefaults<T> | typeof COMMON_FIELDS['dateDeleted']['name']
  >
  // Pick (add on) the fields that are optional
  & Partial<
    PickAny<
      ToRecord<T>,
      ExtractFieldNamesWithDefaults<T>
    >
  >

export type ManualCreateRecordOptions<T extends DataFormatDeclaration> =
  // Pick auto-generated fields (optional)
  Partial<
    PickAny<
      ToRecord<T>,
      ExtractAutoGeneratedFieldNames<T>
    >
  >
  // Pick fields with defaults (optional)
  & Partial<
    PickAny<
      ToRecord<T>,
      ExtractFieldNamesWithDefaults<T>
    >
  >
  // Pick rest of fields (required)
  & Omit<
    ToRecord<T>,
    ExtractAutoGeneratedFieldNames<T> | ExtractFieldNamesWithDefaults<T>
  >

export type ExtractField<T extends DataFormatDeclaration, K extends string> = Extract<
  T['fields'][number],
  { name: K }
>

export type ExtractValueTypeOfFieldName<T extends DataFormatDeclaration, K extends ExtractDataFormatFieldNames<T>> =
  DataFormatFieldToRecordPropertyValue<ExtractField<T, K>>

export type DataFormatSqlInfo<T extends DataFormatDeclaration> = {
  /**
   * Quoted name of the table
   */
  tableName: string
    /**
   * A dictionary of the column names (for each field) of the declaration.
   */
  columnNames: { [fieldName in ExtractDataFormatFieldNames<T>]: string }
  /**
   * List of column names
   */
  columnNameList: string[]
  /**
   * Creates the CREATE TABLE sql for the data format, with the following relations to/from the
   * data format applied to the sql (i.e. foreign keys, unique constraints, etc.).
   */
  createCreateTableSql: (relations?: Relation<DataFormatDeclarations, RelationType.ONE_TO_MANY | RelationType.ONE_TO_ONE>[]) => string
  /**
   * The "`select * from {quoted table name}`" sql
   */
  selectSqlBase: string
  /**
   * Dictionary that maps each field sub set name to its select sql base, i.e. select id, uuid, name from "user"
   */
  fieldSubSetSelectSqlBases: FieldSubSetsSelectSqlBaseDict<T>
  /**
   * The "`update {quoted table name} set`" sql
   */
  updateSqlBase: string
  /**
   * The "`delete from {quoted table name}`" sql
   */
  deleteSqlBase: string
}

/**
 * A data format. This contains additional information that has been analysed
 * from the given `declaration`.
 */
export type DataFormat<T extends DataFormatDeclaration = DataFormatDeclaration> = {
  /**
   * The camel-case name of the data format.
   */
  name: T['name']
  /**
   * The pluralized camel-case name of the data format.
   */
  pluralizedName: T extends { pluralizedName: string } ? T['pluralizedName'] : `${T['name']}s`
  /**
   * Capitalized version of `name`, e.g. "User", "UserGroup", "Recipe", etc.
   */
  capitalizedName: Capitalize<T['name']>
  /**
   * Capitalized and pluralized version of `pluralizedName`, e.g. "Users", "UserGroups", "Recipes", etc.
   */
  capitalizedPluralizedName: Capitalize<T extends { pluralizedName: string } ? T['pluralizedName'] : `${T['name']}s`>
  /**
   * The original data format declaration.
   */
  declaration: T
  /**
   * A dictionary of the fields of the declaration.
   */
  fields: { [fieldName in T['fields'][number]['name']]: Extract<T['fields'][number], { name: fieldName }> }
  /**
   * A dictionary of the field names of the declaration.
   */
  fieldNames: { [fieldName in ExtractDataFormatFieldNames<T>]: fieldName }
  fieldNamesWithEnabledGetByList: ExtractFieldNamesWithGetBy<T>[]
  fieldNamesWithEnabledDeleteByList: ExtractFieldNamesWithDeleteBy<T>[]
  capitalizedFieldNames: CapitalizedFieldNames<T>
  /**
   * List of field names.
   */
  fieldNameList: ExtractDataFormatFieldNames<T>[]
  /**
   * Properties related to sql about the data format.
   */
  sql: DataFormatSqlInfo<T>
  /**
   * A dictionary of the field references (used by other data formats to reference fields of this data format).
   */
  fieldRefs: FieldRefsDict<T>
  /**
   * The list of fields that are included in the create record options.
   */
  createRecordFieldNames: CreateRecordFieldNames<T>
  /**
   * Function that creates a random create-record options, useful for generating sample data.
   */
  createRandomCreateOptions: () => CreateRecordOptions<T>
}

export type ReadonlyOrMutableDataFormat<T extends DataFormatDeclaration = DataFormatDeclaration> =
  DeepReadonlyOrMutable<DataFormat<T>>

export type DataFormatsDict<T extends DataFormatDeclarations = DataFormatDeclarations> = {
  [K in keyof T & `${bigint}` as T[K] extends { name: infer TName }
    ? `${TName & string}`
    : never
  ]: T[K] extends DataFormatDeclaration ? DataFormat<T[K]> : never
}
