/* eslint-disable max-len */
import { randomUUID } from 'crypto'
import {
  DataFormatField,
  DataFormatFieldToValueType,
  DataType,
  DateDataSubType,
  JsonDataSubType,
  NumberDataSubType,
  StringDataSubType,
} from './types'

const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

const LORUM_IPSUM = (
  `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam nulla justo, rhoncus sit amet urna a, aliquam malesuada arcu. Etiam rhoncus risus ut consequat rutrum. Praesent gravida eu lorem vel ullamcorper. Maecenas fringilla velit non rhoncus sagittis. Nam sed lorem in risus faucibus mollis quis vel ante. Vestibulum vulputate tincidunt dui, eu aliquet lacus sagittis eget. Praesent tincidunt ipsum at nibh efficitur lacinia. Suspendisse non viverra nibh, sed hendrerit ante. Vestibulum at tellus non urna vehicula facilisis. Maecenas consectetur semper diam id porttitor.
  
  Phasellus ac sollicitudin tortor. Duis dapibus nibh quis elit lacinia, sit amet lacinia nunc congue. Vestibulum finibus eros vel eleifend rutrum. Nullam finibus elementum leo non tempor. Vestibulum at enim eget nulla auctor ultrices. Nulla pellentesque, arcu quis euismod blandit, justo lacus rutrum elit, non interdum dui quam sit amet urna. Duis molestie rhoncus tellus, non accumsan ante vulputate at. Sed sodales ex ut magna sodales, quis viverra sapien condimentum. Morbi a volutpat elit. Ut accumsan mauris ut finibus commodo. Morbi pulvinar massa ac hendrerit convallis. Proin sit amet finibus libero. Nullam iaculis vel mauris sit amet hendrerit.
  
  Nunc quis consequat nisl. In posuere euismod leo et dignissim. Ut fringilla et metus sed dapibus. Proin sollicitudin posuere lorem vel sagittis. Proin a cursus tortor. Proin interdum massa felis, id viverra massa sollicitudin vel. Mauris pharetra quis lacus ut faucibus. Curabitur sed nisi non diam efficitur facilisis non blandit est. Etiam placerat tellus tellus, ac porta orci venenatis vitae. Integer et pulvinar massa, ac pulvinar justo. Nulla facilisi. Vivamus sollicitudin fermentum nisl, quis volutpat lectus. Cras euismod bibendum dignissim.
  
  Fusce in odio ut neque elementum dignissim vel id lacus. Sed finibus eleifend erat, id sollicitudin turpis tincidunt sit amet. Ut porta sed eros rutrum ornare. Etiam a mi felis. Etiam urna erat, mattis et suscipit venenatis, laoreet id justo. Donec vel urna eget nisi fringilla volutpat. Sed placerat nisi ac enim eleifend, sit amet vulputate dolor suscipit. Integer volutpat ligula at urna bibendum pharetra. Maecenas varius sed ex tristique posuere.
  
  Nullam quis interdum arcu. Morbi et metus arcu. Quisque facilisis, leo eget vulputate eleifend, mi risus finibus metus, at porttitor mauris erat sed ex. Quisque euismod, nisl et tempus feugiat, massa nisi sollicitudin risus, eget pharetra justo erat eu sem. Cras dignissim ligula a justo commodo, et congue tortor dapibus. Nulla facilisi. Phasellus ac pretium eros. Sed gravida auctor erat eu mollis.`
)

const generateRandomString = (length: number) => {
  let result = ''
  const charactersLength = CHARACTERS.length
  for (let i = 0; i < length; i += 1)
    result += CHARACTERS.charAt(Math.floor(Math.random() * charactersLength))
  return result
}

const createStringSampleData = (
  field: DataFormatField<DataType.STRING>,
): DataFormatFieldToValueType<DataFormatField<DataType.STRING>> => {
  switch (field.dataSubType) {
    case StringDataSubType.FIXED_LENGTH:
      return generateRandomString(field.length)
    case StringDataSubType.UUID_V4:
      return randomUUID()
    case StringDataSubType.VARYING_LENGTH:
      return LORUM_IPSUM.substring(0, field.maxLength)
    case StringDataSubType.STRING_ENUM:
      return field.default
    default:
      return null
  }
}

const createNumberSampleData = (
  field: DataFormatField<DataType.NUMBER>,
): DataFormatFieldToValueType<DataFormatField<DataType.NUMBER>> => {
  switch (field.dataSubType) {
    case NumberDataSubType.INTEGER:
      return 1
    case NumberDataSubType.REAL:
      return 1.1
    case NumberDataSubType.SERIAL:
      return 1
    default:
      return null
  }
}

const createBooleanSampleData = (
  field: DataFormatField<DataType.BOOLEAN>,
): DataFormatFieldToValueType<DataFormatField<DataType.BOOLEAN>> => {
  const rand = Math.random()
  return rand < 0.5
}

const createDateSampleData = (
  field: DataFormatField<DataType.DATE>,
): DataFormatFieldToValueType<DataFormatField<DataType.DATE>> => {
  switch (field.dataSubType) {
    case DateDataSubType.DATE:
      return (new Date()).toISOString()
    case DateDataSubType.DATE_TIME:
      return (new Date()).toISOString()
    case DateDataSubType.DATE_TIME_WITH_TIMEZONE:
      return (new Date()).toISOString()
    case DateDataSubType.TIME:
      return (new Date()).toISOString()
    default:
      return null
  }
}

const createJsonSampleData = (
  field: DataFormatField<DataType.JSON>,
): DataFormatFieldToValueType<DataFormatField<DataType.JSON>> => {
  switch (field.dataSubType) {
    case JsonDataSubType.ARRAY:
      return [] // TODO: How do we get some info here to instruct how to create sample data?
    case JsonDataSubType.OBJECT:
      return {} // TODO: Same as above...
    default:
      return null
  }
}

export const createSampleData = <T extends DataFormatField>(field: T): DataFormatFieldToValueType<T> => {
  switch (field.dataType) {
    // TODO: Why are the "as"s necessary here? The switch-case block should be telling tsc what it needs to know...
    case DataType.STRING:
      return createStringSampleData(field) as DataFormatFieldToValueType<T>
    case DataType.NUMBER:
      return createNumberSampleData(field) as DataFormatFieldToValueType<T>
    case DataType.BOOLEAN:
      return createBooleanSampleData(field) as DataFormatFieldToValueType<T>
    case DataType.DATE:
      return createDateSampleData(field) as DataFormatFieldToValueType<T>
    case DataType.JSON:
      return createJsonSampleData(field)
    default:
      return null
  }
}
