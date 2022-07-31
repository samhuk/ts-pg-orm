import { createDataFilter } from '@samhuk/data-filter'
import { createDataQuery } from '@samhuk/data-query'
import { DataFormat, FieldRef } from '../dataFormat/types'
import { removeDuplicates } from '../helpers/array'
import { objectPropsToCamelCase } from '../helpers/string'
import { Relation, RelationType } from '../relations/types'
import { DbService, Entities } from '../types'
import { AnyGetFunctionOptions } from './types'

type RelatedDataPropertyInfo = {
  relatedDataPropertyName: string
  localFieldRef: FieldRef
  foreignFieldRef: FieldRef
  isForeignPlural: boolean
  relation: Relation
}

type RelatedDataPropertyNameToInfoDict = { [relatedDataPropertyName: string]: RelatedDataPropertyInfo }

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

const createSelectSqlForRelatedData = (
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

  let querySql: string
  if (isForeignPlural) {
    const dataQueryRecord = (options as AnyGetFunctionOptions<1>).query
    if (dataQueryRecord != null) {
      const dataQuerySqlInfo = createDataQuery(dataQueryRecord).toSql()
      querySql = `${dataQuerySqlInfo.where} and ${localTableName}.${localColumnName} = $1 ${dataQuerySqlInfo.orderByLimitOffset}`
    }
    else {
      querySql = `where ${localTableName}.${localColumnName} = $1`
    }
  }
  else {
    const dataFilterNodeOrGroup = (options as AnyGetFunctionOptions<0>).filter
    if (dataFilterNodeOrGroup != null) {
      const whereSql = createDataFilter(dataFilterNodeOrGroup).toSql()
      querySql = `where ${whereSql} and ${localTableName}.${localColumnName} = $1 limit 1`
    }
    else {
      querySql = `where ${localTableName}.${localColumnName} = $1 limit 1`
    }
  }

  if (relation.type === RelationType.ONE_TO_ONE || relation.type === RelationType.ONE_TO_MANY) {
    /* E.g.
     * select ... from "user"
     * join "recipe" on "recipe".creator_user_id = "user".id
     * where "user".id = $1
     * ...
     */
    return `select
${columnsSql}
from ${localTableName}
join ${foreignTableName} on ${foreignTableName}.${foreignColumnName} = ${localTableName}.${localColumnName}
${querySql}`
  }

  if (relation.type === RelationType.MANY_TO_MANY) {
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
    /* E.g.
     * select ... from "user"
     * join "user_to_user_group" on "user_to_user_group".user_id = "user".id
     * join "user_group" on "user_group".id = "user_to_user_group".user_group_id
     * where "user".id = $1
     */
    return `select
${columnsSql}
from ${localTableName}
join ${joinTableName} on ${joinTableName}.${localJoinTableColumnName} = ${localTableName}.${localFieldName}
join ${foreignTableName} on ${foreignTableName}.${foreignColumnName} = ${joinTableName}.${foreignJoinTableColumnName}
${querySql}`
  }

  return null
}

const getRelatedDataOfRecord = async (
  entities: Entities,
  db: DbService,
  options: AnyGetFunctionOptions<0>,
  relatedDataPropertyNameToInfoDict: RelatedDataPropertyNameToInfoDict,
  parentRecord: any,
) => {
  const relatedDataPropertyNameAndRelatedDataList = await Promise.all(Object.entries(options.relations)
    .map(([relatedDataPropertyName, childOptions]) => {
      const _childOptions = childOptions as AnyGetFunctionOptions // convenient cast
      const relatedDataPropertyInfo: RelatedDataPropertyInfo = relatedDataPropertyNameToInfoDict[relatedDataPropertyName]
      const localFieldValueForRelatedDataProp = parentRecord[relatedDataPropertyInfo.localFieldRef.fieldName]
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return get(entities, db, _childOptions, relatedDataPropertyInfo, localFieldValueForRelatedDataProp).then(relatedData => ({
        relatedDataPropertyName,
        relatedData,
      }))
    }))
  const result = {} as any
  relatedDataPropertyNameAndRelatedDataList.forEach(item => result[item.relatedDataPropertyName] = item.relatedData)
  return result
}

export const get = async (
  entities: Entities,
  db: DbService,
  options: AnyGetFunctionOptions,
  relatedDataPropertyInfo: RelatedDataPropertyInfo,
  localFieldValue: any,
) => {
  const parentDataFormat = entities.dataFormats[relatedDataPropertyInfo.localFieldRef.formatName]
  const thisDataFormat = entities.dataFormats[relatedDataPropertyInfo.foreignFieldRef.formatName]

  const relatedDataPropertyNameToInfoDict = createRelatedDataPropertyNameToInfoDict(entities, thisDataFormat)
  const requiredLocalFieldsForRelations = Object.values(relatedDataPropertyNameToInfoDict)
    .map(info => info.localFieldRef.fieldName)
  const localFields = removeDuplicates((options.fields ?? []).concat(requiredLocalFieldsForRelations))

  const sql = createSelectSqlForRelatedData(
    parentDataFormat,
    thisDataFormat,
    relatedDataPropertyInfo.localFieldRef.fieldName,
    relatedDataPropertyInfo.foreignFieldRef.fieldName,
    relatedDataPropertyInfo.relation,
    options,
    relatedDataPropertyInfo.isForeignPlural,
    localFields,
  )

  if (relatedDataPropertyInfo.isForeignPlural) {
    const localRecordRows = await db.queryGetRows(sql, [localFieldValue])
    const localRecords = localRecordRows.map(r => objectPropsToCamelCase(r))

    const relatedDataList = options.relations != null && Object.keys(options.relations).length > 0
      ? await Promise.all(localRecords.map(localRecord => (
        getRelatedDataOfRecord(entities, db, options, relatedDataPropertyNameToInfoDict, localRecord)
      )))
      : null

    return localRecords.map((localRecord, i) => ({
      ...localRecord,
      ...relatedDataList[i],
    }))
  }

  const localRecordRow = await db.queryGetFirstRow(sql, [localFieldValue])
  const localRecord = objectPropsToCamelCase(localRecordRow)

  const relatedDataDict = options.relations != null && Object.keys(options.relations).length > 0
    ? await getRelatedDataOfRecord(entities, db, options, relatedDataPropertyNameToInfoDict, localRecord)
    : null

  return {
    ...localRecord,
    ...relatedDataDict,
  }
}

export const getSingle = async (
  entities: Entities,
  db: DbService,
  localDataFormat: DataFormat,
  options: AnyGetFunctionOptions<0>,
) => {
  const relatedDataPropertyNameToInfoDict = createRelatedDataPropertyNameToInfoDict(entities, localDataFormat)
  const requiredLocalFieldsForRelations = Object.values(relatedDataPropertyNameToInfoDict)
    .map(info => info.localFieldRef.fieldName)

  const localFields = removeDuplicates((options.fields ?? []).concat(requiredLocalFieldsForRelations))
  const columnsSql = createColumnsSql(localDataFormat, localFields)
  const whereClauseSql = createDataFilter(options.filter).toSql()
  const whereSql = whereClauseSql != null ? `where ${whereClauseSql}` : ''
  const getLocalRecordSql = `select ${columnsSql} from ${localDataFormat.sql.tableName} ${whereSql} limit 1`
  const localRecordRow = await db.queryGetFirstRow(getLocalRecordSql)
  const localRecord = objectPropsToCamelCase(localRecordRow)

  const relatedDataDict = options.relations != null && Object.keys(options.relations).length > 0
    ? await getRelatedDataOfRecord(entities, db, options, relatedDataPropertyNameToInfoDict, localRecord)
    : null

  const result = {
    ...localRecord,
    ...relatedDataDict,
  }

  return result
}

export const getMultiple = async (
  entities: Entities,
  db: DbService,
  localDataFormat: DataFormat,
  options: AnyGetFunctionOptions<1>,
) => {
  const relatedDataPropertyNameToInfoDict = createRelatedDataPropertyNameToInfoDict(entities, localDataFormat)
  const requiredLocalFieldsForRelations = Object.values(relatedDataPropertyNameToInfoDict)
    .map(info => info.localFieldRef.fieldName)

  const localFields = removeDuplicates((options.fields ?? []).concat(requiredLocalFieldsForRelations))
  const columnsSql = createColumnsSql(localDataFormat, localFields)
  const querySql = createDataQuery(options.query).toSql()?.whereOrderByLimitOffset
  const getLocalRecordSql = `select ${columnsSql} from ${localDataFormat.sql.tableName} ${querySql}`

  const localRecordRows = await db.queryGetRows(getLocalRecordSql)
  const localRecords = localRecordRows.map(r => objectPropsToCamelCase(r))

  const relatedDataList = options.relations != null && Object.keys(options.relations).length > 0
    ? await Promise.all(localRecords.map(localRecord => (
      getRelatedDataOfRecord(entities, db, options, relatedDataPropertyNameToInfoDict, localRecord)
    )))
    : null

  return localRecords.map((localRecord, i) => ({
    ...localRecord,
    ...relatedDataList[i],
  }))
}
