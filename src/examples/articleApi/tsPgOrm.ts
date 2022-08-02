// ------------------------------------------------------------------
// This file loads in defined data formats, along with relations, to
// create a TsPgOrm instance and types used throughout the app.
// ------------------------------------------------------------------

import { createTsPgOrm } from '../..'
import { ToRecord } from '../../dataFormat/types'
import { RelationType } from '../../relations/types'
import { Store } from '../../store/types'
import { USER_DFD, USER_ARTICLE_DFD } from './dataFormats'

// ------------------------------------------------------------------
// Load in data formats and relations to create TsPgOrm
// ------------------------------------------------------------------

/**
 * Article API TsPgOrm
 */
export const ORM = createTsPgOrm()
  .loadDataFormats([
    USER_DFD,
    USER_ARTICLE_DFD,
  ] as const)
  .loadRelations(dfs => [
    {
      type: RelationType.ONE_TO_MANY,
      fromOneField: dfs.user.fieldRefs.id,
      toManyField: dfs.userArticle.fieldRefs.createdByUserId,
      relatedFromOneRecordsName: 'creatorUser',
      relatedToManyRecordsName: 'articles',
    },
  ] as const)

// ------------------------------------------------------------------
// Create types from Data Format Declarations.
// ------------------------------------------------------------------

type UserRecord = ToRecord<typeof USER_DFD>
type UserArticleRecord = ToRecord<typeof USER_ARTICLE_DFD>

// TODO: This will be improved, not requiring references to the declarations.
type UserStore = Store<
  typeof ORM['dataFormatDeclarations'],
  typeof ORM['relationDeclarations'],
  'user'
>

type UserArticleStore = Store<
  typeof ORM['dataFormatDeclarations'],
  typeof ORM['relationDeclarations'],
  'userArticle'
>

export type Stores = {
  user: UserStore
  userArticle: UserArticleStore
}

export type UserProfilePageData = UserRecord & {
  articles: UserArticleRecord[]
}
