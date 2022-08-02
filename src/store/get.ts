import { createDataFilter } from '@samhuk/data-filter'
import { createDataQuery } from '@samhuk/data-query'
import { DataFormat, DataFormatDeclarations, FieldRef } from '../dataFormat/types'
import { removeDuplicates } from '../helpers/array'
import { toDict } from '../helpers/dict'
import { objectPropsToCamelCase } from '../helpers/string'
import { Relation, RelationType } from '../relations/types'
import { DbService, Entities } from '../types'
import { AnyGetFunctionOptions } from './types/get'

type RelatedDataPropertyInfo = {
  relatedDataPropertyName: string
  localFieldRef: FieldRef
  foreignFieldRef: FieldRef
  isForeignPlural: boolean
  relation: Relation
}

type RelatedDataPropertyNameToInfoDict = { [relatedDataPropertyName: string]: RelatedDataPropertyInfo }

type RelatedDataListItem = { relatedDataPropertyName: string, relatedData: any }

/**
 * Creates the columns sql.
 *
 * E.g. `"user"."id", "user"."name", "user"."email", "user"."date_created", ...`
 */
const createColumnsSql = (df: DataFormat, fieldNames?: string[]) => (
  (
    fieldNames
      ?.map(fName => df.sql.columnNames[fName])
      .filter(cName => cName != null)
    ?? df.sql.columnNameList
  )
    .map(cName => `${df.sql.tableName}."${cName}"`)
    .join(', ')
)

const createRelatedDataPropertyNameToInfoDict = (
  entities: Entities,
  localDataFormat: DataFormat,
): RelatedDataPropertyNameToInfoDict => {
  const relatedDataPropertyNameToInfoDict: RelatedDataPropertyNameToInfoDict = {}
  Object.values(entities.relations).forEach(r => {
    let localFieldRef: FieldRef
    let foreignFieldRef: FieldRef
    let manuallyDefinedRelatedDataPropertyName: string
    let isForeignPlural: boolean
    if (r.type === RelationType.ONE_TO_ONE) {
      if (r.fromOneField.formatName === localDataFormat.name) {
        foreignFieldRef = r.toOneField
        localFieldRef = r.fromOneField
        manuallyDefinedRelatedDataPropertyName = r.relatedToOneRecordsName
        isForeignPlural = false
      }
      if (r.toOneField.formatName === localDataFormat.name) {
        foreignFieldRef = r.fromOneField
        localFieldRef = r.toOneField
        manuallyDefinedRelatedDataPropertyName = r.relatedFromOneRecordsName
        isForeignPlural = false
      }
    }
    if (r.type === RelationType.ONE_TO_MANY) {
      if (r.fromOneField.formatName === localDataFormat.name) {
        foreignFieldRef = r.toManyField
        localFieldRef = r.fromOneField
        manuallyDefinedRelatedDataPropertyName = r.relatedToManyRecordsName
        isForeignPlural = true
      }
      if (r.toManyField.formatName === localDataFormat.name) {
        foreignFieldRef = r.fromOneField
        localFieldRef = r.toManyField
        manuallyDefinedRelatedDataPropertyName = r.relatedFromOneRecordsName
        isForeignPlural = false
      }
    }
    if (r.type === RelationType.MANY_TO_MANY) {
      if (r.fieldRef1.formatName === localDataFormat.name) {
        foreignFieldRef = r.fieldRef2
        localFieldRef = r.fieldRef1
        manuallyDefinedRelatedDataPropertyName = r.relatedFieldRef2RecordsName
        isForeignPlural = true
      }
      if (r.fieldRef2.formatName === localDataFormat.name) {
        foreignFieldRef = r.fieldRef1
        localFieldRef = r.fieldRef2
        manuallyDefinedRelatedDataPropertyName = r.relatedFieldRef1RecordsName
        isForeignPlural = true
      }
    }

    if (localFieldRef != null) {
      const relatedDataPropertyName = manuallyDefinedRelatedDataPropertyName
      ?? (isForeignPlural
        ? entities.dataFormats[foreignFieldRef.formatName].pluralizedName
        : entities.dataFormats[foreignFieldRef.formatName].name
      )
      relatedDataPropertyNameToInfoDict[relatedDataPropertyName] = {
        relatedDataPropertyName,
        localFieldRef,
        foreignFieldRef,
        isForeignPlural,
        relation: r,
      }
    }
  })
  return relatedDataPropertyNameToInfoDict
}

const createQuerySqlForRelatedData = (
  localDataFormat: DataFormat,
  foreignDataFormat: DataFormat,
  localFieldName: string,
  options: AnyGetFunctionOptions<0 | 1>,
  isForeignPlural: boolean,
): string => {
  const localTableName = localDataFormat.sql.tableName
  const localColumnName = localDataFormat.sql.columnNames[localFieldName]

  if (isForeignPlural) {
    const dataQueryRecord = (options as AnyGetFunctionOptions<1>).query
    if (dataQueryRecord != null) {
      const dataQuerySqlInfo = createDataQuery(dataQueryRecord).toSql({
        includeWhereWord: false,
        filterTransformer: node => ({ left: foreignDataFormat.sql.columnNames[node.field] }),
        sortingTransformer: node => ({ left: foreignDataFormat.sql.columnNames[node.field] }),
      })
      return 'where '.concat([
        dataQuerySqlInfo.where,
        `${localTableName}.${localColumnName} = $1 ${dataQuerySqlInfo.orderByLimitOffset}`,
      ].filter(s => s != null && s.length > 0).join(' and '))
    }

    return `where ${localTableName}.${localColumnName} = $1`
  }

  const dataFilterNodeOrGroup = (options as AnyGetFunctionOptions<0>).filter
  const whereClauseSql = dataFilterNodeOrGroup != null
    ? createDataFilter(dataFilterNodeOrGroup).toSql({
      transformer: node => ({ left: foreignDataFormat.sql.columnNames[node.field] }),
    })
    : null
  return 'where '.concat([
    whereClauseSql,
    `${localTableName}.${localColumnName} = $1 limit 1`,
  ].filter(s => s != null && s.length > 0).join(' and '))
}

/** E.g.
 * select ... from "user"
 * join "recipe" on "recipe".creator_user_id = "user".id
 * where "user".id = $1
 * ...
 */
const createSelectSqlForOneToOneOrOneToManyRelation = (
  localTableName: string,
  foreignTableName: string,
  localColumnName: string,
  foreignColumnName: string,
  columnsSql: string,
  querySql: string,
): string => `select
${columnsSql}
from ${localTableName}
join ${foreignTableName} on ${foreignTableName}.${foreignColumnName} = ${localTableName}.${localColumnName}
${querySql}`

/** E.g.
 * select ... from "user"
 * join "user_to_user_group" on "user_to_user_group".user_id = "user".id
 * join "user_group" on "user_group".id = "user_to_user_group".user_group_id
 * where "user".id = $1
 */
const createSelectSqlForManyToManyRelation = (
  localTableName: string,
  foreignTableName: string,
  foreignColumnName: string,
  localFieldName: string,
  columnsSql: string,
  querySql: string,
  relation: Relation<DataFormatDeclarations, RelationType.MANY_TO_MANY>,
): string => {
  // E.g. "user_to_user_group"
  const joinTableName = relation.sql.joinTableName
  const isFieldRef1Local = relation.fieldRef1.formatName === localFieldName
  // E.g. "user_id"
  const localJoinTableColumnName = isFieldRef1Local
    ? relation.sql.joinTableFieldRef1ColumnName
    : relation.sql.joinTableFieldRef2ColumnName
  // E.g. "user_group_id"
  const foreignJoinTableColumnName = isFieldRef1Local
    ? relation.sql.joinTableFieldRef2ColumnName
    : relation.sql.joinTableFieldRef1ColumnName

  return `select
${columnsSql}
from ${localTableName}
join ${joinTableName} on ${joinTableName}.${localJoinTableColumnName} = ${localTableName}.${localFieldName}
join ${foreignTableName} on ${foreignTableName}.${foreignColumnName} = ${joinTableName}.${foreignJoinTableColumnName}
${querySql}`
}

const createSelectSqlForThisNode = (
  localDataFormat: DataFormat,
  foreignDataFormat: DataFormat,
  localFieldName: string,
  foreignFieldName: string,
  relation: Relation,
  options: AnyGetFunctionOptions<0 | 1>,
  isForeignPlural: boolean,
  localFieldNames: string[],
) => {
  const localTableName = localDataFormat.sql.tableName
  const foreignTableName = foreignDataFormat.sql.tableName
  const localColumnName = localDataFormat.sql.columnNames[localFieldName]
  const foreignColumnName = foreignDataFormat.sql.columnNames[foreignFieldName]
  const columnsSql = createColumnsSql(foreignDataFormat, localFieldNames)
  const querySql = createQuerySqlForRelatedData(localDataFormat, foreignDataFormat, localFieldName, options, isForeignPlural)

  if (relation.type === RelationType.ONE_TO_ONE || relation.type === RelationType.ONE_TO_MANY)
    return createSelectSqlForOneToOneOrOneToManyRelation(localTableName, foreignTableName, localColumnName, foreignColumnName, columnsSql, querySql)

  if (relation.type === RelationType.MANY_TO_MANY)
    return createSelectSqlForManyToManyRelation(localTableName, foreignTableName, localColumnName, localFieldName, columnsSql, querySql, relation)

  return null
}

const determineFieldsInfo = (
  dataFormat: DataFormat,
  relatedDataPropertyNameToInfoDict: RelatedDataPropertyNameToInfoDict,
  optionsDefinedFields?: string[],
) => {
  const fieldsRequiredForRelations = Object.values(relatedDataPropertyNameToInfoDict)
    .map(info => info.localFieldRef.fieldName)
  const fieldsToSelectFor = optionsDefinedFields != null
    ? removeDuplicates(optionsDefinedFields.concat(fieldsRequiredForRelations))
    : dataFormat.fieldNameList
  const fieldsToKeepInRecord = optionsDefinedFields ?? dataFormat.fieldNameList
  const fieldsOnlyUsedForRelations = optionsDefinedFields != null
    ? fieldsToSelectFor.filter(fName => fieldsToKeepInRecord.indexOf(fName) === -1)
    : []

  return {
    fieldsToSelectFor,
    fieldsOnlyUsedForRelations,
  }
}

const createSelectSqlForRootNode = (
  dataFormat: DataFormat,
  fieldsToSelectFor: string[],
  isPlural: boolean,
  options: AnyGetFunctionOptions<0 | 1>,
): string => {
  const columnsSql = createColumnsSql(dataFormat, fieldsToSelectFor)

  switch (isPlural) {
    case false: {
      const whereClauseSql = createDataFilter((options as AnyGetFunctionOptions<0>).filter).toSql({
        transformer: node => ({ left: dataFormat.sql.columnNames[node.field] }),
      })
      const whereSql = whereClauseSql != null ? `where ${whereClauseSql}` : ''
      return `select ${columnsSql} from ${dataFormat.sql.tableName} ${whereSql} limit 1`
    }
    case true: {
      const querySql = createDataQuery((options as AnyGetFunctionOptions<1>).query).toSql({
        filterTransformer: node => ({ left: dataFormat.sql.columnNames[node.field] }),
        sortingTransformer: node => ({ left: dataFormat.sql.columnNames[node.field] }),
      })?.whereOrderByLimitOffset
      return `select ${columnsSql} from ${dataFormat.sql.tableName} ${querySql}`
    }
    default:
      return null
  }
}

const getRelatedDataOfRecord = async (
  entities: Entities,
  db: DbService,
  optionsRelations: { [relatedDataPropertyName: string]: AnyGetFunctionOptions },
  relatedDataPropertyNameToInfoDict: RelatedDataPropertyNameToInfoDict,
  parentRecord: any,
) => {
  const relatedDataPropertyNameAndRelatedDataList: RelatedDataListItem[] = await Promise.all(
    Object.entries(optionsRelations)
      .map(([relatedDataPropertyName, childOptions]) => {
        const relatedDataPropertyInfo: RelatedDataPropertyInfo = relatedDataPropertyNameToInfoDict[relatedDataPropertyName]
        const fieldValueForRelatedDataProp = parentRecord[relatedDataPropertyInfo.localFieldRef.fieldName]
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        return get(
          entities,
          db,
          childOptions,
          relatedDataPropertyInfo,
          fieldValueForRelatedDataProp,
        ).then(relatedData => ({
          relatedDataPropertyName,
          relatedData,
        }))
      }),
  )

  return toDict(relatedDataPropertyNameAndRelatedDataList, item => ({
    key: item.relatedDataPropertyName,
    value: item.relatedData,
  }))
}

export const get = async (
  entities: Entities,
  db: DbService,
  options: AnyGetFunctionOptions,
  relatedDataPropertyInfo: RelatedDataPropertyInfo,
  parentLinkedFieldValue: any,
) => {
  // Find parent and this data formats for this node
  const parentDataFormat = entities.dataFormats[relatedDataPropertyInfo.localFieldRef.formatName]
  const dataFormat = entities.dataFormats[relatedDataPropertyInfo.foreignFieldRef.formatName]

  const relatedDataPropertyNameToInfoDict = createRelatedDataPropertyNameToInfoDict(entities, dataFormat)

  // Determine field information for this node
  const fieldsInfo = determineFieldsInfo(dataFormat, relatedDataPropertyNameToInfoDict, options.fields)

  // Create sql used to select data (record or records) for this node
  const selectSql = createSelectSqlForThisNode(
    parentDataFormat,
    dataFormat,
    relatedDataPropertyInfo.localFieldRef.fieldName,
    relatedDataPropertyInfo.foreignFieldRef.fieldName,
    relatedDataPropertyInfo.relation,
    options,
    relatedDataPropertyInfo.isForeignPlural,
    fieldsInfo.fieldsToSelectFor,
  )

  // If this node is plural, get records, then recursively get the related data for each record
  if (relatedDataPropertyInfo.isForeignPlural) {
    const recordRows = await db.queryGetRows(selectSql, [parentLinkedFieldValue])
    const records = recordRows.map(r => objectPropsToCamelCase(r))

    if (records.length === 0)
      return []

    const relatedDataList = options.relations != null && Object.keys(options.relations).length > 0
      ? await Promise.all(records.map(record => (
        getRelatedDataOfRecord(entities, db, options.relations, relatedDataPropertyNameToInfoDict, record)
      )))
      : null

    // Remove fields that were only used for related data for this node (for linked field values) for each record
    if (fieldsInfo.fieldsOnlyUsedForRelations.length > 0)
      records.forEach(record => fieldsInfo.fieldsOnlyUsedForRelations.forEach(fName => delete record[fName]))

    return relatedDataList != null
      ? records.map((record, i) => ({
        ...record,
        ...relatedDataList[i],
      }))
      : records
  }

  // Else (if node is singular), get record, then recursively get the related data for it
  const recordRow = await db.queryGetFirstRow(selectSql, [parentLinkedFieldValue])
  const record = objectPropsToCamelCase(recordRow)

  if (record == null)
    return null

  // Get related data of the record for this node
  const relatedDataDict = options.relations != null && Object.keys(options.relations).length > 0
    ? await getRelatedDataOfRecord(entities, db, options.relations, relatedDataPropertyNameToInfoDict, record)
    : null

  // Remove fields that were only used for related data for this node (for linked field values)
  fieldsInfo.fieldsOnlyUsedForRelations.forEach(fName => delete record[fName])

  return {
    ...record,
    ...relatedDataDict,
  }
}

export const getSingle = async (
  entities: Entities,
  db: DbService,
  dataFormat: DataFormat,
  options: AnyGetFunctionOptions<0>,
) => {
  const relatedDataPropertyNameToInfoDict = createRelatedDataPropertyNameToInfoDict(entities, dataFormat)
  const fieldsInfo = determineFieldsInfo(dataFormat, relatedDataPropertyNameToInfoDict, options.fields)

  const selectSql = createSelectSqlForRootNode(dataFormat, fieldsInfo.fieldsToSelectFor, false, options)

  const recordRow = await db.queryGetFirstRow(selectSql)
  const record = objectPropsToCamelCase(recordRow)

  if (record == null)
    return null

  const relatedDataDict = options.relations != null && Object.keys(options.relations).length > 0
    ? await getRelatedDataOfRecord(entities, db, options.relations, relatedDataPropertyNameToInfoDict, record)
    : null

  fieldsInfo.fieldsOnlyUsedForRelations.forEach(fName => delete record[fName])

  return {
    ...record,
    ...relatedDataDict,
  }
}

export const getMultiple = async (
  entities: Entities,
  db: DbService,
  dataFormat: DataFormat,
  options: AnyGetFunctionOptions<1>,
) => {
  const relatedDataPropertyNameToInfoDict = createRelatedDataPropertyNameToInfoDict(entities, dataFormat)
  const fieldsInfo = determineFieldsInfo(dataFormat, relatedDataPropertyNameToInfoDict, options.fields)

  const selectSql = createSelectSqlForRootNode(dataFormat, fieldsInfo.fieldsToSelectFor, true, options)

  const recordRows = await db.queryGetRows(selectSql)
  const records = recordRows.map(r => objectPropsToCamelCase(r))

  if (records.length === 0)
    return []

  const relatedDataList = options.relations != null && Object.keys(options.relations).length > 0
    ? await Promise.all(records.map(record => (
      getRelatedDataOfRecord(entities, db, options.relations, relatedDataPropertyNameToInfoDict, record)
    )))
    : null

  if (fieldsInfo.fieldsOnlyUsedForRelations.length > 0)
    records.forEach(record => fieldsInfo.fieldsOnlyUsedForRelations.forEach(fName => delete record[fName]))

  return relatedDataList != null
    ? records.map((record, i) => ({
      ...record,
      ...relatedDataList[i],
    }))
    : records
}
