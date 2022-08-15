import { SimplePgClient } from 'simple-pg-client/dist/types'
import { DataFormat, DataFormatDeclarations, DataFormatsDict } from '../../dataFormat/types'
import { capitalize, objectPropsToCamelCase } from '../../helpers/string'
import { Relation, RelationDeclarations, RelationType } from '../../relations/types'
import {
  DeleteLinkByIdFunctionOptions,
  JoinTableStore,
  JoinTableStoresDict,
  _CreateJoinTableRecordOptions,
  _CreateLinkFunction,
  _CreateLinksFunction,
  _DeleteLinkByIdFunction,
} from './types'

const createCreateLinkFieldsInfo = <T extends DataFormatDeclarations, K extends Relation<T, RelationType.MANY_TO_MANY>>(
  dataFormats: DataFormatsDict<T>,
  relation: K,
) => {
  const fieldRef1DataFormat = (dataFormats as any)[relation.fieldRef1.formatName] as DataFormat
  const fieldRef2DataFormat = (dataFormats as any)[relation.fieldRef2.formatName] as DataFormat
  const fieldRef1Field = fieldRef1DataFormat.fields[relation.fieldRef1.fieldName]
  const fieldRef2Field = fieldRef2DataFormat.fields[relation.fieldRef2.fieldName]
  const fieldRef1JoinTableFieldName = `${fieldRef1DataFormat.name}${capitalize(fieldRef1Field.name)}`
  const fieldRef2JoinTableFieldName = `${fieldRef2DataFormat.name}${capitalize(fieldRef2Field.name)}`

  return {
    fieldRef1JoinTableFieldName,
    fieldRef2JoinTableFieldName,
  }
}

const createCreateLinkFieldSql = (
  relation: Relation<DataFormatDeclarations, RelationType.MANY_TO_MANY>,
  i: number = 1,
): string => `insert into ${relation.sql.joinTableName}
(${relation.sql.joinTableFieldRef1ColumnName}, ${relation.sql.joinTableFieldRef2ColumnName})
values ($${i}, $${i + 1}) returning *`

const createCreateLinkFunction = <T extends DataFormatDeclarations, K extends Relation<T, RelationType.MANY_TO_MANY>>(
  dataFormats: DataFormatsDict<T>,
  relation: K,
  db: SimplePgClient,
): _CreateLinkFunction<T, K> => {
  const fieldsInfo = createCreateLinkFieldsInfo(dataFormats, relation)
  const sql = createCreateLinkFieldSql(relation)

  return async (options: _CreateJoinTableRecordOptions<T, K>) => {
    const fieldRef1FieldValue = (options as any)[fieldsInfo.fieldRef1JoinTableFieldName]
    const fieldRef2FieldValue = (options as any)[fieldsInfo.fieldRef2JoinTableFieldName]
    const row = await db.queryGetFirstRow(sql, [fieldRef1FieldValue, fieldRef2FieldValue])
    return objectPropsToCamelCase(row)
  }
}

const createCreateLinksFunction = <T extends DataFormatDeclarations, K extends Relation<T, RelationType.MANY_TO_MANY>>(
  dataFormats: DataFormatsDict<T>,
  relation: K,
  db: SimplePgClient,
): _CreateLinksFunction<T, K> => {
  const fieldsInfo = createCreateLinkFieldsInfo(dataFormats, relation)

  return async (options: _CreateJoinTableRecordOptions<T, K>[]) => {
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

const createDeleteLinkbyIdFunction = <T extends DataFormatDeclarations, K extends Relation<T, RelationType.MANY_TO_MANY>>(
  relation: K,
  db: SimplePgClient,
): _DeleteLinkByIdFunction<T, K> => {
  const baseSql = `delete from ${relation.sql.joinTableName} where id = $1`

  return async (options: DeleteLinkByIdFunctionOptions) => {
    const _return = options.return ?? false
    const sql = `${baseSql} returning ${_return ? '*' : '1'}`
    const row = await db.queryGetFirstRow(sql, [options.id])
    return (_return ? objectPropsToCamelCase(row) : row != null) as any
  }
}

const createJoinTableStore = <T extends DataFormatDeclarations>(
  dataFormats: DataFormatsDict<T>,
  relation: Relation<T, RelationType.MANY_TO_MANY>,
  db: SimplePgClient,
): JoinTableStore => {
  const createLink = createCreateLinkFunction(dataFormats, relation, db)
  const createLinks = createCreateLinksFunction(dataFormats, relation, db)
  const deleteLink = createDeleteLinkbyIdFunction(relation, db)

  return {
    provision: () => db.query(relation.sql.createJoinTableSql).then(() => true as any),
    unprovision: () => db.query(relation.sql.dropJoinTableSql).then(() => true as any),
    create: options => createLink(options as any) as any,
    createMultiple: options => createLinks(options as any),
    deleteById: options => deleteLink(options) as any,
  }
}

export const createJoinTableStoresDict = <
  T extends DataFormatDeclarations,
  K extends RelationDeclarations<T>
>(
    dataFormats: DataFormatsDict<T>,
    manyToManyRelationsList: Relation<T, RelationType.MANY_TO_MANY>[],
    db: SimplePgClient,
  ): JoinTableStoresDict<T, K> => {
  const joinTableStoresDict: JoinTableStoresDict<T, K> = {} as any
  manyToManyRelationsList.forEach(r => {
    const storeName = r.joinTableStoreName ?? r.relationName;
    (joinTableStoresDict as any)[storeName] = createJoinTableStore(dataFormats, r, db)
  })
  return joinTableStoresDict
}
