import { DeepReadonly, Mutable, ExpandOneLevel, PickAny, DeepReadonlyOrMutable } from '../helpers/types'
import { Relation, RelationType } from '../relations/types'
import { COMMON_FIELDS } from './common'

export enum DataType {
  NUMBER,
  STRING,
  BOOLEAN,
  DATE,
  JSON
}

export enum NumberDataSubType {
  INTEGER,
  SERIAL,
  REAL
}

export enum StringDataSubType {
  UUID_V4,
  SHA_256,
  FIXED_LENGTH,
  VARYING_LENGTH,
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
      allowNull?: boolean
      dataSubType: {
        [NumberDataSubType.INTEGER]: { size?: ThreeStepNumberSize, default?: number }
        [NumberDataSubType.SERIAL]: { size?: ThreeStepNumberSize }
        [NumberDataSubType.REAL]: { size?: TwoStepNumberSize, default?: number }
      }
    }
    [DataType.STRING]: {
      allowNull?: boolean
      default?: string
      dataSubType: {
        [StringDataSubType.UUID_V4]: { autoGenerate?: boolean }
        [StringDataSubType.SHA_256]: { }
        [StringDataSubType.FIXED_LENGTH]: { length: number }
        [StringDataSubType.VARYING_LENGTH]: { maxLength: number },
        [StringDataSubType.STRING_ENUM]: { maxLength?: number }
      }
    }
    [DataType.DATE]: {
      allowNull?: boolean
      defaultToCurrentEpoch?: boolean
      default?: string
      dataSubType: {
        [DateDataSubType.DATE]: { }
        [DateDataSubType.TIME]: { }
        [DateDataSubType.DATE_TIME]: { }
        [DateDataSubType.DATE_TIME_WITH_TIMEZONE]: { }
      }
    }
    [DataType.BOOLEAN]: {
      allowNull?: boolean
      default?: boolean
      dataSubType: {
        [BooleanDataSubType.TRUE_FALSE]: { }
      }
    }
    [DataType.JSON]: {
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
  foreignKeySettings?: {
    foreignDataItemName: string
    foreignDataItemFieldName: string
  }
}

type DataFormatFieldWithoutGeneric = DataFormatFieldBase & ToDiscrimUnion<ToDiscrimUnion<DataTypeSubTypeMapping, 'dataType'>, 'dataSubType'>

export type DataFormatField<
  TDataType extends DataType = DataType,
  TDataSubType extends DataTypeToSubType[TDataType] = any,
  TName extends string = string,
> = Extract<DataFormatFieldWithoutGeneric, { dataType: TDataType, dataSubType: TDataSubType }> & { name: TName }

/**
 * Declares a data format. A data format details the list of fields of a particular entity
 * within the application.
 */
export type MutableDataFormatDeclaration = {
  /**
   * The camel-case, singular name of the format, e.g. "user", "userGroup", "recipe".
   */
  name: string
  /**
   * Optional display name. Default: Title-case version of `name`.
   */
  displayName?: string
  /**
   * The list of fields within the data format.
   */
  fields: DataFormatField[]
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
export type DataFormatDeclarationToRecord<T extends DataFormatDeclaration> = ExpandOneLevel<
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
      DataFormatDeclarationToRecord<T>,
      ExtractNonAutoGeneratedFieldNames<T>
    >,
    // From the fields that aren't auto-generated, omit dateDeleted as a special case
    ExtractFieldNamesWithDefaults<T> | typeof COMMON_FIELDS['dateDeleted']['name']
  >
  // Pick (add on) the fields that are optional
  & Partial<
    PickAny<
      DataFormatDeclarationToRecord<T>,
      ExtractFieldNamesWithDefaults<T>
    >
  >

export type ManualCreateRecordOptions<T extends DataFormatDeclaration> =
  // Pick auto-generated fields (optional)
  Partial<
    PickAny<
      DataFormatDeclarationToRecord<T>,
      ExtractAutoGeneratedFieldNames<T>
    >
  >
  // Pick fields with defaults (optional)
  & Partial<
    PickAny<
      DataFormatDeclarationToRecord<T>,
      ExtractFieldNamesWithDefaults<T>
    >
  >
  // Pick rest of fields (required)
  & Omit<
    DataFormatDeclarationToRecord<T>,
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
   * The "`update {quoted table name} set`" sql
   */
  updateSqlBase: string
  /**
   * The "`update {quoted table name} set date_deleted = CURRENT_TIMESTAMP`" sql
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
