// ------------------------------------------------------------------
// This file uses the TsPgOrm instance created in ./tsPgOrm.ts to create
// stores. A mock DB client service is used and mock responses are
// queued to mimick a real database client service.
// ------------------------------------------------------------------

import { randomUUID } from 'crypto'
import { MockDbService, createMockDbService } from '../../mock/dbService'
import { ORM, Stores } from './tsPgOrm'

/**
 * Queues the responses that are required for the api later on.
 */
const queueMockDbServiceResponses = (db: MockDbService) => {
  // Responses for the store provisioning. The response is unimportant in this case.
  db.queueResponse(null)
  db.queueResponse(null)

  // Responses for the individual create() calls
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
    title: 'How to create tsPgOrm',
    body: 'lorum ipsum foo bar fizz buzz',
    created_by_user_id: 1,
    date_created: Date.now(),
    date_deleted: null,
  }
  db.queueResponse(newUserArticle)

  // Responses for the user profile page
  db.queueResponse(newUser)
  db.queueResponse([newUserArticle])
}

export const createAndProvisionStores = async () => {
  const db = createMockDbService()
  queueMockDbServiceResponses(db)
  // -- Create and provision stores
  const stores = await ORM.createStores({ db })
  return stores
}

/**
 * Populates the stores with some seed data.
 */
export const populateSeedData = async (stores: Stores) => {
  const newUser = await stores.user.create({
    name: 'user 1',
  })

  const newUserArticle = await stores.userArticle.create({
    title: 'How to create tsPgOrm',
    body: 'lorum ipsum foo bar fizz buzz',
    createdByUserId: newUser.id,
  })

  return {
    newUser,
    newUserArticle,
  }
}
