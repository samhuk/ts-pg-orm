import { createEntities } from '.'
import { createDataFormatDeclaration } from './dataFormat'
import { BASE_ENTITY_FIELDS } from './dataFormat/common'
import { DataType, DateDataSubType, NumberDataSubType, StringDataSubType } from './dataFormat/types'
import { RelationType } from './relations/types'

export const d1 = createDataFormatDeclaration({
  name: 'user',
  fields: [
    { name: 'id', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.SERIAL, enableGetBy: true },
    { name: 'name', dataType: DataType.STRING, dataSubType: StringDataSubType.VARYING_LENGTH, maxLength: 50 },
  ],
} as const)

export const d2 = createDataFormatDeclaration({
  name: 'userGroup',
  fields: [
    { name: 'id', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.SERIAL, enableGetBy: true },
    { name: 'name', dataType: DataType.STRING, dataSubType: StringDataSubType.VARYING_LENGTH, maxLength: 50 },
  ],
} as const)

export const d3 = createDataFormatDeclaration({
  name: 'userAddress',
  pluralizedName: 'userAddresses',
  fields: [
    { name: 'userId', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.INTEGER, enableGetBy: true },
    { name: 'streetAddress', dataType: DataType.STRING, dataSubType: StringDataSubType.VARYING_LENGTH, maxLength: 200 },
    { name: 'postCode', dataType: DataType.STRING, dataSubType: StringDataSubType.VARYING_LENGTH, maxLength: 10 },
  ],
} as const)

export const d4 = createDataFormatDeclaration({
  name: 'recipe',
  fields: [
    { name: 'id', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.SERIAL, enableGetBy: true },
    { name: 'createdByUserId', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.INTEGER },
    { name: 'imageId', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.INTEGER },
  ],
} as const)

export const d5 = createDataFormatDeclaration({
  name: 'article',
  fields: [
    ...BASE_ENTITY_FIELDS,
    { name: 'title', dataType: DataType.STRING, dataSubType: StringDataSubType.VARYING_LENGTH, maxLength: 200, enableGetBy: true },
    { name: 'datePublished', dataType: DataType.DATE, dataSubType: DateDataSubType.DATE_TIME_WITH_TIMEZONE, allowNull: true },
    { name: 'createdByUserId', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.INTEGER },
  ],
  fieldSubSets: [
    {
      name: 'metaData',
      fields: ['uuid', 'title', 'createdByUserId'],
    },
    {
      name: 'selectOption',
      fields: ['uuid', 'title'],
    },
  ],
} as const)

export const d6 = createDataFormatDeclaration({
  name: 'image',
  fields: [
    { name: 'id', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.SERIAL, enableGetBy: true },
    { name: 'fileName', dataType: DataType.STRING, dataSubType: StringDataSubType.VARYING_LENGTH, maxLength: 250 },
    { name: 'createdByUserId', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.INTEGER },
  ],
} as const)

const dfds = [d1, d2, d3, d4, d5, d6] as const

export const entities = createEntities()
  .loadDataFormats(dfds)
  .loadRelations(dfs => [
    {
      type: RelationType.MANY_TO_MANY,
      fieldRef1: dfs.user.fieldRefs.id,
      fieldRef2: dfs.userGroup.fieldRefs.id,
    },
    {
      type: RelationType.ONE_TO_ONE,
      fromOneField: dfs.user.fieldRefs.id,
      toOneField: dfs.userAddress.fieldRefs.userId,
    },
    {
      type: RelationType.ONE_TO_MANY,
      fromOneField: dfs.user.fieldRefs.id,
      toManyField: dfs.recipe.fieldRefs.createdByUserId,
    },
    {
      type: RelationType.ONE_TO_MANY,
      fromOneField: dfs.image.fieldRefs.id,
      toManyField: dfs.recipe.fieldRefs.imageId,
    },
    {
      type: RelationType.ONE_TO_MANY,
      fromOneField: dfs.user.fieldRefs.id,
      toManyField: dfs.image.fieldRefs.createdByUserId,
    },
  ] as const)

export const entitiesWithNamesProvided = createEntities()
  .loadDataFormats(dfds)
  .loadRelations(dfs => [
    {
      type: RelationType.MANY_TO_MANY,
      fieldRef1: dfs.user.fieldRefs.id,
      fieldRef2: dfs.userGroup.fieldRefs.id,
      relatedFieldRef1RecordsName: 'relatedUsers',
      relatedFieldRef2RecordsName: 'relatedUserGroups',
    },
    {
      type: RelationType.ONE_TO_ONE,
      fromOneField: dfs.user.fieldRefs.id,
      toOneField: dfs.userAddress.fieldRefs.userId,
      relatedFromOneRecordsName: 'relatedUser',
      relatedToOneRecordsName: 'relatedUserAddress',
    },
    {
      type: RelationType.ONE_TO_MANY,
      fromOneField: dfs.user.fieldRefs.id,
      toManyField: dfs.recipe.fieldRefs.createdByUserId,
      relatedFromOneRecordsName: 'relatedUser',
      relatedToManyRecordsName: 'relatedRecipes',
    },
  ] as const)
