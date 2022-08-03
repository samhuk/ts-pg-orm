import { Operator } from '@samhuk/data-filter/dist/types'
import { SortingDirection } from '@samhuk/data-query/dist/sorting/types'
import * as fs from 'fs'
import { createConsoleLogEventHandlers } from 'simple-pg-client'
import { createTsPgOrm } from '../..'
import { createDataFormatDeclaration } from '../../dataFormat'
import { BASE_ENTITY_FIELDS, COMMON_FIELDS } from '../../dataFormat/common'
import { StringDataSubType, NumberDataSubType, DataType } from '../../dataFormat/types'
import { RelationType } from '../../relations/types'

const USER_DFD = createDataFormatDeclaration({
  name: 'user',
  fields: [
    ...BASE_ENTITY_FIELDS,
    COMMON_FIELDS.name50,
    { name: 'email', dataType: DataType.STRING, dataSubType: StringDataSubType.VARYING_LENGTH, maxLength: 100 },
    { name: 'passwordHash', dataType: DataType.STRING, dataSubType: StringDataSubType.FIXED_LENGTH, length: 64 },
  ],
} as const)

const ARTICLE_DFD = createDataFormatDeclaration({
  name: 'article',
  fields: [
    ...BASE_ENTITY_FIELDS,
    { name: 'title', dataType: DataType.STRING, dataSubType: StringDataSubType.VARYING_LENGTH, maxLength: 100 },
    { name: 'creatorUserId', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.INTEGER },
    { name: 'thumbnailImageId', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.INTEGER },
  ],
} as const)

const IMAGE_DFD = createDataFormatDeclaration({
  name: 'image',
  fields: [
    ...BASE_ENTITY_FIELDS,
    { name: 'fileName', dataType: DataType.STRING, dataSubType: StringDataSubType.VARYING_LENGTH, maxLength: 200 },
    { name: 'creatorUserId', dataType: DataType.NUMBER, dataSubType: NumberDataSubType.INTEGER },
  ],
} as const)

const ORM = createTsPgOrm()
  .loadDataFormats([USER_DFD, ARTICLE_DFD, IMAGE_DFD] as const)
  .loadRelations(dfs => [
    {
      type: RelationType.ONE_TO_MANY,
      fromOneField: dfs.user.fieldRefs.id,
      toManyField: dfs.article.fieldRefs.creatorUserId,
    },
    {
      type: RelationType.ONE_TO_MANY,
      fromOneField: dfs.image.fieldRefs.id,
      toManyField: dfs.article.fieldRefs.thumbnailImageId,
    },
    {
      type: RelationType.ONE_TO_MANY,
      fromOneField: dfs.user.fieldRefs.id,
      toManyField: dfs.image.fieldRefs.creatorUserId,
    },
  ] as const)

const init = async () => {
  await ORM.initDbClient({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    db: 'ts-pg-orm-test',
    createDbIfNotExists: true,
    extensions: ['uuid-ossp'],
    events: {
      ...createConsoleLogEventHandlers(),
      onQuery: (q, m, sql, p) => console.log(m, p),
      onQueryError: (q, m, sql, p) => console.log(m),
    },
  })

  const stores = await ORM.sql.createStores({
    provisionOrder: ['user', 'image', 'article'],
    unprovisionStores: true,
  })

  await stores.user.create({ name: 'user 1', email: 'user1@email.com', passwordHash: '123' })
  await stores.user.create({ name: 'user 2', email: 'user2@email.com', passwordHash: '456' })
  const user3 = await stores.user.create({ name: 'user 3', email: 'user3@email.com', passwordHash: '789' })

  const image1 = await stores.image.create({ fileName: 'user3avatar.png', creatorUserId: user3.id })
  await stores.image.create({ fileName: 'funnydog.png', creatorUserId: user3.id })
  await stores.image.create({ fileName: 'funnycat.png', creatorUserId: user3.id })

  await stores.article.create({ title: 'I am User 3', creatorUserId: user3.id, thumbnailImageId: image1.id })

  const userWithTheirStuff = await stores.user.getSingle({
    fields: ['uuid', 'name', 'email', 'dateCreated'],
    filter: { field: 'id', op: Operator.EQUALS, val: 3 },
    relations: {
      articles: {
        fields: ['uuid', 'dateCreated', 'title'],
        query: { filter: { field: 'title', op: Operator.IN, val: ['I am User 3'] } },
        relations: {
          image: { fields: ['uuid', 'dateCreated', 'fileName'] },
        },
      },
      images: {
        fields: ['uuid', 'dateCreated', 'fileName'],
        query: { page: 1, pageSize: 5, sorting: [{ field: 'dateCreated', dir: SortingDirection.DESC }] },
      },
    },
  })

  fs.writeFileSync('./realDbTestOutput.json', JSON.stringify(userWithTheirStuff, null, 2))

  ORM.db.client.end()
}

init()
