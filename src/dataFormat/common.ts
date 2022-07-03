import { DataFormatField, DataType, DateDataSubType, NumberDataSubType, StringDataSubType, ThreeStepNumberSize } from './types'

const createCommonFields = <
  T extends { [name: string]: DataFormatField }
>(f: T): T => f

export const createUuidField = <
  TName extends string,
  TAllowNull extends boolean,
>(name: TName, allowNull?: TAllowNull) => ({
    name,
    dataType: DataType.STRING,
    dataSubType: StringDataSubType.FIXED_LENGTH,
    length: 36,
    allowNull,
  } as const)

export const COMMON_FIELDS = createCommonFields({
  /**
   * "id" serial integer id field. Likely used as the primary key.
   */
  id: {
    name: 'id',
    displayName: 'ID',
    dataType: DataType.NUMBER,
    dataSubType: NumberDataSubType.SERIAL,
    size: ThreeStepNumberSize.REGULAR,
  },
  /**
   * "uuid" auto-generated (by default) uuid v4 string field
   */
  uuid: {
    name: 'uuid',
    displayName: 'UUID',
    dataType: DataType.STRING,
    dataSubType: StringDataSubType.UUID_V4,
  },
  /**
   * "dateCreated" auto-generated (by default) date-time field that defaults to current timestamp
   */
  dateCreated: {
    name: 'dateCreated',
    dataType: DataType.DATE,
    dataSubType: DateDataSubType.DATE_TIME_WITH_TIMEZONE,
    defaultToCurrentEpoch: true,
  },
  /**
   * "dateLastModified" date-time field
   */
  dateLastModified: {
    name: 'dateLastModified',
    dataType: DataType.DATE,
    dataSubType: DateDataSubType.DATE_TIME_WITH_TIMEZONE,
    allowNull: true,
  },
  /**
   * "dateDeleted" date-time field
   */
  dateDeleted: {
    name: 'dateDeleted',
    dataType: DataType.DATE,
    dataSubType: DateDataSubType.DATE_TIME_WITH_TIMEZONE,
    allowNull: true,
  },
  /**
   * "name" string field with maximum 50 characters
   */
  name50: {
    name: 'name',
    dataType: DataType.STRING,
    dataSubType: StringDataSubType.VARYING_LENGTH,
    maxLength: 50,
  },
  /**
   * "name" string field with maximum 100 characters
   */
  name100: {
    name: 'name',
    dataType: DataType.STRING,
    dataSubType: StringDataSubType.VARYING_LENGTH,
    maxLength: 100,
  },
  /**
   * "description" string field with maximum 300 characters
   */
  description300: {
    name: 'description',
    dataType: DataType.STRING,
    dataSubType: StringDataSubType.VARYING_LENGTH,
    maxLength: 300,
    allowNull: true,
  },
  /**
   * "createdByUserId" number field
   */
  createdByUserId: {
    name: 'createdByUserId',
    dataType: DataType.NUMBER,
    dataSubType: NumberDataSubType.INTEGER,
  },
} as const)

/**
 * The base fields of any entity in the application. These are not however required for an entity,
 * but are very likely to make sense for them to have. They include:
 *
 * * `id`
 * * `uuid`
 * * `dateCreated`
 * * `dateDeleted`
 */
export const BASE_ENTITY_FIELDS = [
  COMMON_FIELDS.id,
  COMMON_FIELDS.uuid,
  COMMON_FIELDS.dateCreated,
  COMMON_FIELDS.dateDeleted,
]
