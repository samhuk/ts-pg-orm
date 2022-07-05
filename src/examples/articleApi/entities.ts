// ------------------------------------------------------------------
// This file loads in defined data formats, along with relations, to
// create Entities and types used throughout the app.
// ------------------------------------------------------------------

import { createEntities } from '../..'
import { ToRecord } from '../../dataFormat/types'
import { RelationType } from '../../relations/types'
import { Store } from '../../store/types'
import { USER_DFD, USER_ARTICLE_DFD } from './dataFormats'

// ------------------------------------------------------------------
// Load in data formats and relations to create Entities
// ------------------------------------------------------------------

/**
 * Article API Entities
 */
export const ENTITIES = createEntities()
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
// Create types from ENTITIES
// ------------------------------------------------------------------

type UserRecord = ToRecord<typeof USER_DFD>
type UserArticleRecord = ToRecord<typeof USER_ARTICLE_DFD>

// TODO: This will be improved, not requiring references to the declarations.
type UserStore = Store<
  typeof ENTITIES['dataFormatDeclarations'],
  typeof ENTITIES['relationDeclarations'],
  'user'
>

type UserArticleStore = Store<
  typeof ENTITIES['dataFormatDeclarations'],
  typeof ENTITIES['relationDeclarations'],
  'userArticle'
>

export type Stores = {
  user: UserStore
  userArticle: UserArticleStore
}

export type UserProfilePageData = UserRecord & {
  articles: UserArticleRecord[]
}
