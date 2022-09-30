import { NonManyToManyRelationList } from '../../relations/types'
import { Fields } from './field'

export type DataFormatSql<TFields extends Fields = Fields> = {
  tableName: string
  unquotedTableName: string
  cols: { [_ in keyof TFields]: string }
  unquotedCols: { [_ in keyof TFields]: string }
  createRecordCols: { [_ in keyof TFields]: string }
  columnNameList: string[]
  unquotedColumnNameList: string[]
  createRecordColumnNameList: string[]
  createTableSql: (relations: NonManyToManyRelationList) => string
}
