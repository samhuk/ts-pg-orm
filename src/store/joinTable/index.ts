import { SimplePgClient } from 'simple-pg-client/dist/types'
import { DataFormats } from '../../dataFormat/types'
import { capitalize, objectPropsToCamelCase } from '../../helpers/string'
import { Relation, Relations, RelationType } from '../../relations/types'
import { deleteBase } from '../delete'
import {
  DeleteLinkByIdFunctionOptions,
  JoinTableStore,
  JoinTableStoresDict,
  _CreateJoinTableRecordOptions,
  _CreateLinkFunction,
  _CreateLinksFunction,
  _DeleteLinkByIdFunction,
} from './types'

const createCreateLinkFieldsInfo = (
  dataFormats: DataFormats,
  relation: Relation<RelationType.MANY_TO_MANY>,
) => {
  const fieldRef1DataFormat = dataFormats[relation.fieldRef1.dataFormat]
  const fieldRef2DataFormat = dataFormats[relation.fieldRef2.dataFormat]
  const fieldRef1Field = fieldRef1DataFormat.fields[relation.fieldRef1.field]
  const fieldRef2Field = fieldRef2DataFormat.fields[relation.fieldRef2.field]
  const fieldRef1JoinTableFieldName = `${fieldRef1DataFormat.name}${capitalize(fieldRef1Field.name)}`
  const fieldRef2JoinTableFieldName = `${fieldRef2DataFormat.name}${capitalize(fieldRef2Field.name)}`

  return {
    fieldRef1JoinTableFieldName,
    fieldRef2JoinTableFieldName,
  }
}

const createCreateLinkFieldSql = (
  relation: Relation<RelationType.MANY_TO_MANY>,
  i: number = 1,
): string => `insert into ${relation.sql.joinTableName}
(${relation.sql.joinTableFieldRef1ColumnName}, ${relation.sql.joinTableFieldRef2ColumnName})
values ($${i}, $${i + 1}) returning *`

const createCreateLinkFunction = (
  dataFormats: DataFormats,
  relation: Relation<RelationType.MANY_TO_MANY>,
  db: SimplePgClient,
): _CreateLinkFunction => {
  const fieldsInfo = createCreateLinkFieldsInfo(dataFormats, relation)
  const sql = createCreateLinkFieldSql(relation)

  return async (options: _CreateJoinTableRecordOptions) => {
    const fieldRef1FieldValue = (options as any)[fieldsInfo.fieldRef1JoinTableFieldName]
    const fieldRef2FieldValue = (options as any)[fieldsInfo.fieldRef2JoinTableFieldName]
    const row = await db.queryGetFirstRow(sql, [fieldRef1FieldValue, fieldRef2FieldValue])
    return objectPropsToCamelCase(row)
  }
}

const createCreateLinksFunction = (
  dataFormats: DataFormats,
  relation: Relation<RelationType.MANY_TO_MANY>,
  db: SimplePgClient,
): _CreateLinksFunction => {
  const fieldsInfo = createCreateLinkFieldsInfo(dataFormats, relation)

  return async (options: _CreateJoinTableRecordOptions[]) => {
    const sqlLines: string[] = []
    for (let i = 1; i < options.length * 2; i += 2)
      sqlLines.push(createCreateLinkFieldSql(relation, i))

    const sql = sqlLines.join(';\n')
    const fieldRef1FieldValues = options.map(createRecordOptions => (createRecordOptions as any)[fieldsInfo.fieldRef1JoinTableFieldName])
    const fieldRef2FieldValues = options.map(createRecordOptions => (createRecordOptions as any)[fieldsInfo.fieldRef2JoinTableFieldName])

    const parameters: any[] = []
    for (let i = 0; i < options.length; i += 1)
      parameters.push(fieldRef1FieldValues[i], fieldRef2FieldValues[i])

    await db.query(sql, parameters)
  }
}

const createDeleteLinkbyIdFunction = (
  relation: Relation<RelationType.MANY_TO_MANY>,
  db: SimplePgClient,
): _DeleteLinkByIdFunction => {
  const baseSql = `delete from ${relation.sql.joinTableName} where id = $1`

  return async (options: DeleteLinkByIdFunctionOptions) => {
    const _return = options.return ?? false
    const sql = `${baseSql} returning ${_return ? '*' : '1'}`
    const row = await db.queryGetFirstRow(sql, [options.id])
    return (_return ? objectPropsToCamelCase(row) : row != null) as any
  }
}

const createJoinTableStore = (
  dataFormats: DataFormats,
  relation: Relation<RelationType.MANY_TO_MANY>,
  db: SimplePgClient,
): JoinTableStore => {
  const createLink = createCreateLinkFunction(dataFormats, relation, db)
  const createLinks = createCreateLinksFunction(dataFormats, relation, db)
  const deleteLink = createDeleteLinkbyIdFunction(relation, db)

  const fieldsInfo = createCreateLinkFieldsInfo(dataFormats, relation)
  const fieldNameToColumnName = {
    id: 'id',
    dateCreated: 'date_created',
    [fieldsInfo.fieldRef1JoinTableFieldName]: relation.sql.joinTableFieldRef1ColumnName,
    [fieldsInfo.fieldRef2JoinTableFieldName]: relation.sql.joinTableFieldRef2ColumnName,
  }

  return {
    create: options => createLink(options as any) as any,
    createMultiple: options => createLinks(options as any),
    deleteById: options => deleteLink(options) as any,
    delete: options => deleteBase(db, relation.sql.joinTableName, fieldNameToColumnName, options) as any,
  }
}

export const createJoinTableStoresDict = <
  TDataFormats extends DataFormats,
  TRelations extends Relations,
>(
    dataFormats: TDataFormats,
    manyToManyRelationList: Relation<RelationType.MANY_TO_MANY>[],
    db: SimplePgClient,
  ): JoinTableStoresDict<TDataFormats, TRelations> => {
  const joinTableStoresDict: JoinTableStoresDict<TDataFormats, TRelations> = {} as any
  manyToManyRelationList.forEach(r => {
    (joinTableStoresDict as any)[r.name] = createJoinTableStore(dataFormats, r, db)
  })
  return joinTableStoresDict
}
