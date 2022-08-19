import { createOrm } from '..'
import { RelationType } from '../../relationNew/types'
import { USER_DF, ARTICLE_DF } from './dataFormats'

const ORM = createOrm()
  .defineDataFormats([USER_DF, ARTICLE_DF] as const)
  .defineRelations(dfs => [
    {
      type: RelationType.ONE_TO_MANY,
      fromOneField: USER_DF.fieldRefs.id,
      toManyField: ARTICLE_DF.fieldRefs.creatorUserId,
    },
  ] as const)

const dataFormat1 = ORM.dataFormats.article
const relation1 = ORM.relations['user.id <-->> article.creatorUserId']
