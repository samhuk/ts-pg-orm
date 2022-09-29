import { DataFormatList } from './dataFormat/types'
import { TsPgOrmWithNoRelations } from './types'

export const createTsPgOrm = <TDataFormatList extends DataFormatList>(
  dataFormatList: TDataFormatList,
// eslint-disable-next-line arrow-body-style
): TsPgOrmWithNoRelations<TDataFormatList> => {
  return {
    dataFormats: {} as any,
    setRelations: relationOptionsList => ({
      dataFormats: {} as any,
      relations: {} as any,
    }),
  }
}
