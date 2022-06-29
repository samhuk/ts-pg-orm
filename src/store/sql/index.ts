import { toDict } from '../../helpers/dict'
import { objectPropsToCamelCase } from '../../helpers/string'
import { DataFormat, DataFormatDeclarations } from '../../dataFormat/types'
import { RelationDeclarations, Relation, RelationType, RelationsDict, ExtractRelevantRelations } from '../../relations/types'
import { createDbStoreBase } from '../base/db'
import { StoreBase } from '../base/types'
import {
  Store,
  OneToOneFromOneFunctionName,
  OneToOneToOneFunctionName,
  OneToManyFromOneFunctionName,
  OneToManyToManyFunctionName,
  ManyToManyFieldRef1FunctionName,
  ManyToManyFieldRef2FunctionName,
  ManyToManyFieldRef1FunctionDict,
  ManyToManyFieldRef2FunctionDict,
  OneToManyFromOneFunctionDict,
  OneToManyToManyFunctionDict,
  OneToOneFromOneFunctionDict,
  OneToOneToOneFunctionDict,
  RelationGetterFunctionsDict,
} from '../types'
import {
  createOneToOneFromOneRelationSelectSql,
  createOneToOneToOneRelationSelectSql,
  createOneToManyFromOneRelationSelectSql,
  createOneToManyToManyRelationSelectSql,
  createManyToManyFieldRef1RelationSelectSql,
  createManyToManyFieldRef2RelationSelectSql,
} from './relationSelectors'
import { DbStoreOptions } from './types'

export const getRelationsRelevantToDataFormat = <
  T extends DataFormatDeclarations,
  K extends Relation<T>[],
  L extends T[number]['name']
>(relationList: K, dataFormatName: L): ExtractRelevantRelations<L, K>[] => (
  relationList.filter(d => (
    (d.type === RelationType.ONE_TO_ONE && d.fromOneField.formatName === dataFormatName)
    || (d.type === RelationType.ONE_TO_ONE && d.toOneField.formatName === dataFormatName)
    || (d.type === RelationType.ONE_TO_MANY && d.fromOneField.formatName === dataFormatName)
    || (d.type === RelationType.ONE_TO_MANY && d.toManyField.formatName === dataFormatName)
    || (d.type === RelationType.MANY_TO_MANY && d.fieldRef1.formatName === dataFormatName)
    || (d.type === RelationType.MANY_TO_MANY && d.fieldRef2.formatName === dataFormatName)
  )) as ExtractRelevantRelations<L, K>[]
  )

/**
 * Finds all of the relations where this data format requires a foreign key. This will be the
 * case if this data format is being referenced as the "to many" of any "one to many" relations
 * or as the "to one" of any "one to one" relations.
 */
const getRelevantRelationsForForeignKeys = <
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  L extends T[number]['name']
>(
    relationsDict: RelationsDict<T, K>,
    dataFormat: Extract<T[number], { name: L }>,
  ) => Object.values(relationsDict)
    .filter(r => {
      const _r = r as Relation<T>
      return (_r.type === RelationType.ONE_TO_MANY && _r.toManyField.formatName === dataFormat.name)
        || (_r.type === RelationType.ONE_TO_ONE && _r.toOneField.formatName === dataFormat.name)
    }) as Relation<T, RelationType.ONE_TO_MANY | RelationType.ONE_TO_ONE>[]

export const createEntityDbStore = <
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>,
  // The chosen data format declaration name
  L extends T[number]['name'],
>(options: DbStoreOptions<T, K, L>): Store<T, K, L> => {
  type TLocalDataFormatDeclaration = Extract<T[number], { name: L }>
  const relationList = Object.values(options.relations) as Relation<T>[]
  const relevantRelations = getRelationsRelevantToDataFormat(relationList, options.dataFormatName)

  // @ts-ignore
  const localDataFormat = options.dataFormats[options.dataFormatName] as DataFormat<TLocalDataFormatDeclaration>

  // -- Relevant relations for each type

  const relationsForOneToOneFromOne = relevantRelations.filter(r => (
    r.type === RelationType.ONE_TO_ONE && localDataFormat.name === r.fromOneField.formatName
  )) as Relation<T, RelationType.ONE_TO_ONE>[]

  const relationsForOneToOneToOne = relevantRelations.filter(r => (
    r.type === RelationType.ONE_TO_ONE && localDataFormat.name === r.toOneField.formatName
  )) as Relation<T, RelationType.ONE_TO_ONE>[]

  const relationsForOneToManyFromOne = relevantRelations.filter(r => (
    r.type === RelationType.ONE_TO_MANY && localDataFormat.name === r.fromOneField.formatName
  )) as Relation<T, RelationType.ONE_TO_MANY>[]

  const relationsForOneToManyToMany = relevantRelations.filter(r => (
    r.type === RelationType.ONE_TO_MANY && localDataFormat.name === r.toManyField.formatName
  )) as Relation<T, RelationType.ONE_TO_MANY>[]

  const relationsForManyToManyFieldRef1 = relevantRelations.filter(r => (
    r.type === RelationType.MANY_TO_MANY && localDataFormat.name === r.fieldRef1.formatName
  )) as Relation<T, RelationType.MANY_TO_MANY>[]

  const relationsForManyToManyFieldRef2 = relevantRelations.filter(r => (
    r.type === RelationType.MANY_TO_MANY && localDataFormat.name === r.fieldRef2.formatName
  )) as Relation<T, RelationType.MANY_TO_MANY>[]

  // -- Function names for each relation for each type

  const functionNamesForOneToOneFromOne = relationsForOneToOneFromOne.map(r => (
    r.getRelatedToOneFieldRecordsStoreName
    // @ts-ignore
    ?? `get${options.dataFormats[r.toOneField.formatName].capitalizedName}Of${options.dataFormats[r.fromOneField.formatName].capitalizedName}`
  )) as OneToOneFromOneFunctionName<T, typeof relationsForOneToOneFromOne[number]>[]

  const functionNamesForOneToOneToOne = relationsForOneToOneToOne.map(r => (
    r.getRelatedFromOneFieldRecordsStoreName
    // @ts-ignore
    ?? `get${options.dataFormats[r.fromOneField.formatName].capitalizedName}Of${options.dataFormats[r.toOneField.formatName].capitalizedName}`
  )) as OneToOneToOneFunctionName<T, typeof relationsForOneToOneToOne[number]>[]

  const functionNamesForOneToManyFromOne = relationsForOneToManyFromOne.map(r => (
    r.getRelatedToManyFieldRecordsStoreName
    // @ts-ignore
    ?? `get${options.dataFormats[r.toManyField.formatName].capitalizedPluralizedName}Of${options.dataFormats[r.fromOneField.formatName].capitalizedName}`
  )) as OneToManyFromOneFunctionName<T, typeof relationsForOneToManyFromOne[number]>[]

  const functionNamesForOneToManyToMany = relationsForOneToManyToMany.map(r => (
    r.getRelatedFromOneFieldRecordsStoreName
    // @ts-ignore
    ?? `get${options.dataFormats[r.fromOneField.formatName].capitalizedName}Of${options.dataFormats[r.toManyField.formatName].capitalizedName}`
  )) as OneToManyToManyFunctionName<T, typeof relationsForOneToManyToMany[number]>[]

  const functionNamesForManyToManyFieldRef1 = relationsForManyToManyFieldRef1.map(r => (
    r.getRelatedFieldRef2RecordsStoreName
    // @ts-ignore
    ?? `get${options.dataFormats[r.fieldRef2.formatName].capitalizedPluralizedName}Of${options.dataFormats[r.fieldRef1.formatName].capitalizedName}`
  )) as ManyToManyFieldRef1FunctionName<T, typeof relationsForManyToManyFieldRef1[number]>[]

  const functionNamesForManyToManyFieldRef2 = relationsForManyToManyFieldRef2.map(r => (
    r.getRelatedFieldRef1RecordsStoreName
    // @ts-ignore
    ?? `get${options.dataFormats[r.fieldRef1.formatName].capitalizedPluralizedName}Of${options.dataFormats[r.fieldRef2.formatName].capitalizedName}`
  )) as ManyToManyFieldRef2FunctionName<T, typeof relationsForManyToManyFieldRef2[number]>[]

  // -- Property names for each relation in "getWithAllRelations"

  const namesForOneToOneFromOne = relationsForOneToOneFromOne.map(r => (
    // @ts-ignore
    `${options.dataFormats[r.toOneField.formatName].name}`
  )) as OneToOneFromOneFunctionName<T, typeof relationsForOneToOneFromOne[number]>[]

  const namesForOneToOneToOne = relationsForOneToOneToOne.map(r => (
    // @ts-ignore
    `${options.dataFormats[r.fromOneField.formatName].name}`
  )) as OneToOneToOneFunctionName<T, typeof relationsForOneToOneToOne[number]>[]

  const namesForOneToManyFromOne = relationsForOneToManyFromOne.map(r => (
    // @ts-ignore
    `${options.dataFormats[r.toManyField.formatName].pluralizedName}`
  )) as OneToManyFromOneFunctionName<T, typeof relationsForOneToManyFromOne[number]>[]

  const namesForOneToManyToMany = relationsForOneToManyToMany.map(r => (
    // @ts-ignore
    `${options.dataFormats[r.fromOneField.formatName].name}`
  )) as OneToManyToManyFunctionName<T, typeof relationsForOneToManyToMany[number]>[]

  const namesForManyToManyFieldRef1 = relationsForManyToManyFieldRef1.map(r => (
    // @ts-ignore
    `${options.dataFormats[r.fieldRef2.formatName].pluralizedName}`
  )) as ManyToManyFieldRef1FunctionName<T, typeof relationsForManyToManyFieldRef1[number]>[]

  const namesForManyToManyFieldRef2 = relationsForManyToManyFieldRef2.map(r => (
    // @ts-ignore
    `${options.dataFormats[r.fieldRef1.formatName].pluralizedName}`
  )) as ManyToManyFieldRef2FunctionName<T, typeof relationsForManyToManyFieldRef2[number]>[]

  // -- Getter function dicts for each type

  const functionsForOneToOneFromOne = toDict(functionNamesForOneToOneFromOne, (functionName, i) => {
    const relation = relationsForOneToOneFromOne[i]
    const sql = createOneToOneFromOneRelationSelectSql(options.dataFormats, relation)

    return {
      key: functionName,
      value: async (linkedFieldValue: any) => {
        const row = await options.db.queryGetFirstRow(sql, [linkedFieldValue])
        return objectPropsToCamelCase(row)
      },
    }
  }) as unknown as OneToOneFromOneFunctionDict<T, K, L>

  const functionsForOneToOneToOne = toDict(functionNamesForOneToOneToOne, (functionName, i) => {
    const relation = relationsForOneToOneToOne[i]
    const sql = createOneToOneToOneRelationSelectSql(options.dataFormats, relation)

    return {
      key: functionName,
      value: async (linkedFieldValue: any) => {
        const row = await options.db.queryGetFirstRow(sql, [linkedFieldValue])
        return objectPropsToCamelCase(row)
      },
    }
  }) as unknown as OneToOneToOneFunctionDict<T, K, L>

  const functionsForOneToManyFromOne = toDict(functionNamesForOneToManyFromOne, (functionName, i) => {
    const relation = relationsForOneToManyFromOne[i]
    const sql = createOneToManyFromOneRelationSelectSql(options.dataFormats, relation)

    return {
      key: functionName,
      value: async (linkedFieldValue: any) => {
        const rows = await options.db.queryGetRows(sql, [linkedFieldValue])
        return rows.map(objectPropsToCamelCase)
      },
    }
  }) as unknown as OneToManyFromOneFunctionDict<T, K, L>

  const functionsForOneToManyToMany = toDict(functionNamesForOneToManyToMany, (functionName, i) => {
    const relation = relationsForOneToManyToMany[i]
    const sql = createOneToManyToManyRelationSelectSql(options.dataFormats, relation)

    return {
      key: functionName,
      value: async (linkedFieldValue: any) => {
        const row = await options.db.queryGetFirstRow(sql, [linkedFieldValue])
        return objectPropsToCamelCase(row)
      },
    }
  }) as unknown as OneToManyToManyFunctionDict<T, K, L>

  const functionsForManyToManyFieldRef1 = toDict(functionNamesForManyToManyFieldRef1, (functionName, i) => {
    const relation = relationsForManyToManyFieldRef1[i]

    const sql = createManyToManyFieldRef1RelationSelectSql(options.dataFormats, relation)

    return {
      key: functionName,
      value: async (localFieldValue: any) => {
        const rows = await options.db.queryGetRows(sql, [localFieldValue])
        return rows.map(objectPropsToCamelCase)
      },
    }
  }) as unknown as ManyToManyFieldRef1FunctionDict<T, K, L>

  const functionsForManyToManyFieldRef2 = toDict(functionNamesForManyToManyFieldRef2, (functionName, i) => {
    const relation = relationsForManyToManyFieldRef2[i]

    const sql = createManyToManyFieldRef2RelationSelectSql(options.dataFormats, relation)

    return {
      key: functionName,
      value: async (localFieldValue: any) => {
        const rows = await options.db.queryGetRows(sql, [localFieldValue])
        return rows.map(objectPropsToCamelCase)
      },
    }
  }) as unknown as ManyToManyFieldRef2FunctionDict<T, K, L>

  const relationsStore: RelationGetterFunctionsDict<T, K, L> = {
    ...functionsForOneToOneFromOne,
    ...functionsForOneToOneToOne,
    ...functionsForOneToManyFromOne,
    ...functionsForOneToManyToMany,
    ...functionsForManyToManyFieldRef1,
    ...functionsForManyToManyFieldRef2,
  }

  const baseStore: StoreBase<TLocalDataFormatDeclaration> = createDbStoreBase({
    db: options.db,
    dataFormat: localDataFormat,
  })

  // @ts-ignore
  const relevantRelationsForForeignKeys = getRelevantRelationsForForeignKeys(options.relations, localDataFormat)
  const createTableSql = localDataFormat.sql.createCreateTableSql(relevantRelationsForForeignKeys)

  return {
    ...baseStore,
    ...relationsStore,
    getByIdWithAllRelations: async (id: number) => {
      const baseRecord = await baseStore.getById(id)

      const propertyNameAndResultPromiseList: ({ result: any, propertyName: string })[] = await Promise.all([]
        .concat(functionNamesForOneToOneFromOne.map((functionName, i) => (
          // @ts-ignore
          relationsStore[functionName](id).then(result => ({ result, propertyName: namesForOneToOneFromOne[i] }))
        )))
        .concat(functionNamesForOneToOneToOne.map((functionName, i) => (
          // @ts-ignore
          relationsStore[functionName](id).then(result => ({ result, propertyName: namesForOneToOneToOne[i] }))
        )))
        .concat(functionNamesForOneToManyFromOne.map((functionName, i) => (
          // @ts-ignore
          relationsStore[functionName](id).then(result => ({ result, propertyName: namesForOneToManyFromOne[i] }))
        )))
        .concat(functionNamesForOneToManyToMany.map((functionName, i) => (
          // @ts-ignore
          relationsStore[functionName](id).then(result => ({ result, propertyName: namesForOneToManyToMany[i] }))
        )))
        .concat(functionNamesForManyToManyFieldRef1.map((functionName, i) => (
          // @ts-ignore
          relationsStore[functionName](id).then(result => ({ result, propertyName: namesForManyToManyFieldRef1[i] }))
        )))
        .concat(functionNamesForManyToManyFieldRef2.map((functionName, i) => (
          // @ts-ignore
          relationsStore[functionName](id).then(result => ({ result, propertyName: namesForManyToManyFieldRef2[i] }))
        ))))

      const relatedRecordsDict = toDict(propertyNameAndResultPromiseList, item => ({
        key: item.propertyName, value: item.result,
      }))

      return {
        ...baseRecord,
        ...relatedRecordsDict,
      }
    },
    provision: () => options.db.queryGetRows(createTableSql)
      .then(() => true),
    unprovision: () => options.db.queryGetRows(`drop table if exists ${localDataFormat.sql.tableName}`)
      .then(() => true),
  } as unknown as Store<T, K, L>
}
