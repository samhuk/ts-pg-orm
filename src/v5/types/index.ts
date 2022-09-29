import { DataFormatList, DataFormats } from '../dataFormat/types'
import { RelationOptionsList, Relations } from '../relations/types'

export type TsPgOrmWithNoRelations<TDataFormatList extends DataFormatList> = {
  dataFormats: DataFormats<TDataFormatList>
  setRelations: <TRelationOptionsList extends RelationOptionsList<DataFormats<TDataFormatList>>>(
    relationOptionsList: TRelationOptionsList
  ) => TsPgOrm<DataFormats<TDataFormatList>, TRelationOptionsList>
}

export type TsPgOrm<
  TDataFormats extends DataFormats,
  TRelationOptionsList extends RelationOptionsList<TDataFormats>
> = {
  dataFormats: TDataFormats,
  relations: Relations<TDataFormats, TRelationOptionsList>
}
