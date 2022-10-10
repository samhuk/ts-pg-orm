export enum DataType {
  STR = 'str',
  NUM = 'num',
  BOOL = 'bool',
  EPOCH = 'epoch',
  JSON = 'json'
}

export enum StrSubType {
  FIXED_LENGTH,
  VAR_LENGTH,
  UUID_V4,
  ENUM
}

export enum NumSubType {
  INT,
  INT_ENUM,
  SERIAL,
  REAL
}

export enum EpochSubType {
  DATE,
  TIME,
  DATE_TIME,
  DATE_TIME_WITH_TIMEZONE
}

export enum JsonSubType {
  OBJECT,
  ARRAY
}

export type DataTypeToDefaultValueType = {
  [DataType.STR]: string
  [DataType.NUM]: number
  [DataType.BOOL]: boolean
  [DataType.EPOCH]: Date
  [DataType.JSON]: {
    [JsonSubType.ARRAY]: any[]
    [JsonSubType.OBJECT]: any[]
  }
}

export type DataTypeToSubType = {
  [DataType.STR]: StrSubType
  [DataType.NUM]: NumSubType
  [DataType.BOOL]: undefined
  [DataType.EPOCH]: EpochSubType
  [DataType.JSON]: JsonSubType
}

export type AnySubType = StrSubType | NumSubType | EpochSubType | JsonSubType

export type AnyDataType = DataType.STR | DataType.NUM | DataType.BOOL | DataType.EPOCH | DataType.JSON

export enum ThreeStepNumberSize {
  SMALL,
  REGULAR,
  LARGE,
}

export enum TwoStepNumberSize {
  REGULAR,
  LARGE,
}
