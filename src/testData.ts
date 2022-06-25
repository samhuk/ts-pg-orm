import { createEntities } from '.'
import { createDataFormatDeclaration } from './dataFormat'
import { DataType, NumberDataSubType, StringDataSubType } from './dataFormat/types'
import { RelationType } from './relations/types'

export const d1 = createDataFormatDeclaration({
  name: 'e1',
  fields: [
    { name: 'a', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.INTEGER },
    { name: 'b', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.INTEGER },
    { name: 'c', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.INTEGER },
  ],
} as const)

export const d2 = createDataFormatDeclaration({
  name: 'e2',
  fields: [
    { name: 'd', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.INTEGER },
    { name: 'e', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.INTEGER },
    { name: 'f', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.INTEGER },
  ],
} as const)

export const d3 = createDataFormatDeclaration({
  name: 'user',
  fields: [
    { name: 'id', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.SERIAL },
    { name: 'name', dataType: DataType.STRING, dataSubType: StringDataSubType.VARYING_LENGTH, maxLength: 50 },
  ],
} as const)

export const d4 = createDataFormatDeclaration({
  name: 'userGroup',
  fields: [
    { name: 'id', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.SERIAL },
    { name: 'name', dataType: DataType.STRING, dataSubType: StringDataSubType.VARYING_LENGTH, maxLength: 50 },
  ],
} as const)

export const entities = createEntities()
  .loadDataFormats([d1, d2, d3, d4] as const)
  .loadRelations(dfs => [
    {
      type: RelationType.ONE_TO_ONE,
      fromOneField: dfs.e1.fieldRefs.a,
      toOneField: dfs.e2.fieldRefs.d,
    },
    {
      type: RelationType.ONE_TO_MANY,
      fromOneField: dfs.e1.fieldRefs.b,
      toManyField: dfs.e2.fieldRefs.e,
    },
    {
      type: RelationType.MANY_TO_MANY,
      fieldRef1: dfs.e1.fieldRefs.c,
      fieldRef2: dfs.e2.fieldRefs.f,
    },
    {
      type: RelationType.MANY_TO_MANY,
      fieldRef1: dfs.user.fieldRefs.id,
      fieldRef2: dfs.userGroup.fieldRefs.id,
      getRelatedFieldRef1RecordsStoreName: 'getUsersOfUserGroup',
      getRelatedFieldRef2RecordsStoreName: 'getUserGroupsOfUser',
    },
  ] as const)
