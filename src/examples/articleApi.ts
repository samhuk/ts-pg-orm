import { randomUUID } from 'crypto'
import { createServer } from 'http'
import { exit } from 'process'
import { createEntities } from '..'
import { createDataFormatDeclaration } from '../dataFormat'
import { BASE_ENTITY_FIELDS, COMMON_FIELDS } from '../dataFormat/common'
import { DataFormatDeclarationToRecord, DataType, StringDataSubType } from '../dataFormat/types'
import { createMockDbService, MockDbService } from '../mock/dbService'
import { createDefaultManyToManyRelation } from '../relations/common'
import { RelationType } from '../relations/types'
import { Store } from '../store/types'

// -- Define User Data Format Declaration
const USER_DFD = createDataFormatDeclaration({
  name: 'user',
  fields: [
    // Provide id, uuid, dateCreated, and dateDeleted fields
    ...BASE_ENTITY_FIELDS,
    // 50-character varying name field
    COMMON_FIELDS.name50,
  ],
} as const)

// -- Define User Article Data Format Declaration
const USER_ARTICLE_DFD = createDataFormatDeclaration({
  name: 'userArticle',
  fields: [
    // Provide id, uuid, dateCreated, and dateDeleted fields
    ...BASE_ENTITY_FIELDS,
    // 50-character varying name field
    {
      name: 'title',
      dataType: DataType.STRING,
      dataSubType: StringDataSubType.VARYING_LENGTH,
      maxLength: 150,
    },
    // Article body text
    {
      name: 'body',
      dataType: DataType.STRING,
      dataSubType: StringDataSubType.VARYING_LENGTH,
      maxLength: 5000,
    },
    COMMON_FIELDS.createdByUserId,
  ],
} as const)

// -- Define User Article Tag Data Format Declaration
const USER_ARTICLE_TAG_DFD = createDataFormatDeclaration({
  name: 'userArticleTag',
  fields: [
    // Provide id, uuid, dateCreated, and dateDeleted fields
    ...BASE_ENTITY_FIELDS,
    // 50-character varying name field
    {
      name: 'name',
      dataType: DataType.STRING,
      dataSubType: StringDataSubType.VARYING_LENGTH,
      maxLength: 100,
    },
    COMMON_FIELDS.createdByUserId,
  ],
} as const)

// -- Load Data Format Declarations and relations
export const ENTITIES = createEntities()
  .loadDataFormats([
    USER_DFD,
    USER_ARTICLE_DFD,
    USER_ARTICLE_TAG_DFD,
  ] as const)
  .loadRelations(dfs => [
    {
      type: RelationType.ONE_TO_MANY,
      fromOneField: dfs.user.fieldRefs.id,
      toManyField: dfs.userArticle.fieldRefs.createdByUserId,
      relatedFromOneRecordsName: 'creatorUser',
      relatedToManyRecordsName: 'articles',
    },
    createDefaultManyToManyRelation('userArticle', 'userArticleTag'),
  ] as const)

// -- Create types from ENTITIES
type UserRecord = DataFormatDeclarationToRecord<typeof USER_DFD>
type UserArticleRecord = DataFormatDeclarationToRecord<typeof USER_ARTICLE_DFD>

// TODO: This will be improved.
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

type UserArticleTagStore = Store<
  typeof ENTITIES['dataFormatDeclarations'],
  typeof ENTITIES['relationDeclarations'],
  'userArticleTag'
>

type Stores = {
  user: UserStore
  userArticle: UserArticleStore
  userArticleTag: UserArticleTagStore
}

type UserProfilePageData = UserRecord & {
  articles: UserArticleRecord[]
}

/**
 * Queues the responses that are required for the api.
 */
const queueMockDbServiceResponses = (db: MockDbService) => {
  // -- Responses for the store provisioning. The response is unimportant in this case.
  db.queueResponse(null)
  db.queueResponse(null)
  db.queueResponse(null)
  db.queueResponse(null)

  const newUser: any = {
    id: 1,
    uuid: randomUUID(),
    name: 'user 1',
    date_created: Date.now(),
    date_deleted: null,
  }
  db.queueResponse(newUser)

  const newUserArticle: any = {
    id: 1,
    uuid: randomUUID(),
    title: 'How to create entities',
    body: 'lorum ipsum foo bar fizz buzz',
    created_by_user_id: 1,
    date_created: Date.now(),
    date_deleted: null,
  }
  db.queueResponse(newUserArticle)

  db.queueResponse({
    id: 1,
    uuid: randomUUID(),
    title: 'How to create entities',
    body: 'lorum ipsum foo bar fizz buzz',
    created_by_user_id: 1,
    date_created: Date.now(),
    date_deleted: null,
  })

  // -- Responses for the user profile page
  db.queueResponse(newUser)
  db.queueResponse([newUserArticle])
}

const createAndProvisionStores = async () => {
  const db = createMockDbService()
  queueMockDbServiceResponses(db)
  // -- Create stores
  const userDbStore = await ENTITIES.sqldb.createEntityDbStore('user', db)
  const userArticleDbStore = await ENTITIES.sqldb.createEntityDbStore('userArticle', db)
  const userArticleTagDbStore = await ENTITIES.sqldb.createEntityDbStore('userArticleTag', db)
  // -- Provision stores and join table
  await userDbStore.provision()
  await userArticleDbStore.provision()
  await userArticleTagDbStore.provision()
  await ENTITIES.sqldb.createJoinTables(db)

  return {
    user: userDbStore,
    userArticle: userArticleDbStore,
    userArticleTag: userArticleTagDbStore,
  }
}

/**
 * Populates the stores with some seed data.
 */
const populateSeedData = async (stores: Stores) => {
  const newUser = await stores.user.add({
    name: 'user 1',
  })

  const newUserArticle = await stores.userArticle.add({
    title: 'How to create entities',
    body: 'lorum ipsum foo bar fizz buzz',
    createdByUserId: newUser.id,
  })

  const newUserArticleTag = await stores.userArticleTag.add({
    name: 'tech',
    createdByUserId: newUser.id,
  })

  return {
    newUser,
    newUserArticle,
    newUserArticleTag,
  }
}

const init = async () => {
  const stores = await createAndProvisionStores()
  await populateSeedData(stores)

  const server = createServer(async (req, res) => {
    console.log('Received request to ', req.url)

    if (req.method === 'GET' && req.url === '/userProfile/1') {
      // Use the created types and stores to have robust and fully type-enforced controller logic.
      const userWithArticles: UserProfilePageData = await stores.user.getByIdWithRelations(1, ['articles'])
      // -- Send the response
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(userWithArticles))
      console.log('Sent response to sender. Shutting down example api. Please wait a few seconds...')
      server.close(() => {
        exit(0)
      })
      return
    }

    res.writeHead(404)
    res.end()
  }).listen(3000)
  server.on('listening', () => 'example api listening on http://localhost:3000. Send request to /userProfile/1')
}

init()
