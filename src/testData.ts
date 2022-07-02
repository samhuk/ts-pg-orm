import { createEntities } from '.'
import { createDataFormatDeclaration } from './dataFormat'
import { DataType, NumberDataSubType, StringDataSubType } from './dataFormat/types'
import { RelationType } from './relations/types'

export const d1 = createDataFormatDeclaration({
  name: 'user',
  fields: [
    { name: 'id', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.SERIAL },
    { name: 'name', dataType: DataType.STRING, dataSubType: StringDataSubType.VARYING_LENGTH, maxLength: 50 },
  ],
} as const)

export const d2 = createDataFormatDeclaration({
  name: 'userGroup',
  fields: [
    { name: 'id', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.SERIAL },
    { name: 'name', dataType: DataType.STRING, dataSubType: StringDataSubType.VARYING_LENGTH, maxLength: 50 },
  ],
} as const)

export const d3 = createDataFormatDeclaration({
  name: 'userAddress',
  pluralizedName: 'userAddresses',
  fields: [
    { name: 'userId', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.INTEGER },
    { name: 'streetAddress', dataType: DataType.STRING, dataSubType: StringDataSubType.VARYING_LENGTH, maxLength: 200 },
    { name: 'postCode', dataType: DataType.STRING, dataSubType: StringDataSubType.VARYING_LENGTH, maxLength: 10 },
  ],
} as const)

export const d4 = createDataFormatDeclaration({
  name: 'recipe',
  fields: [
    { name: 'id', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.SERIAL },
    { name: 'createdByUserId', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.INTEGER },
  ],
} as const)

const dfds = [d1, d2, d3, d4] as const

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
  ] as const)

export const entitiesWithNamesProvided = createEntities()
  .loadDataFormats(dfds)
  .loadRelations(dfs => [
    {
      type: RelationType.MANY_TO_MANY,
      fieldRef1: dfs.user.fieldRefs.id,
      fieldRef2: dfs.userGroup.fieldRefs.id,
      getRelatedFieldRef1RecordsName: 'getUsers',
      getRelatedFieldRef2RecordsName: 'getUserGroups',
      relatedFieldRef1RecordsName: 'relatedUsers',
      relatedFieldRef2RecordsName: 'relatedUserGroups',
    },
    {
      type: RelationType.ONE_TO_ONE,
      fromOneField: dfs.user.fieldRefs.id,
      toOneField: dfs.userAddress.fieldRefs.userId,
      getRelatedFromOneRecordsName: 'getUser',
      getRelatedToOneRecordsName: 'getUserAddress',
      relatedFromOneRecordsName: 'relatedUser',
      relatedToOneRecordsName: 'relatedUserAddress',
    },
    {
      type: RelationType.ONE_TO_MANY,
      fromOneField: dfs.user.fieldRefs.id,
      toManyField: dfs.recipe.fieldRefs.createdByUserId,
      getRelatedFromOneRecordsName: 'getUser',
      getRelatedToManyRecordsName: 'getRecipes',
      relatedFromOneRecordsName: 'relatedUser',
      relatedToManyRecordsName: 'relatedRecipes',
    },
  ] as const)
