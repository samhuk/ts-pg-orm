// ------------------------------------------------------------------
// This file creates a basic single-endpoint API which demonstrates
// how stores and types created from a TsPgOrm instance can be used to
// easily create robust and fully type-safe controller logic.
// ------------------------------------------------------------------

import { Operator } from '@samhuk/data-filter/dist/types'
import { createServer, Server, ServerResponse } from 'http'
import { exit } from 'process'
import { UserProfilePageData } from './tsPgOrm'
import { createAndProvisionStores, populateSeedData } from './stores'

const sendSuccessResponse = (res: ServerResponse, server: Server, data: any) => {
  // Construct and send the response
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
  console.log('Sent response to sender. Shutting down example api. Please wait a few seconds...')
  server.close(() => exit(0))
}

const init = async () => {
  const stores = await createAndProvisionStores()
  await populateSeedData(stores)

  const server = createServer(async (req, res) => {
    console.log('Received request to ', req.url)

    // Handle GET /userProfile/1
    if (req.method === 'GET' && req.url === '/userProfile/1') {
      // Use the created types and stores to have robust and fully type-safe controller logic.
      const userWithArticles: UserProfilePageData = await stores.user.getSingle({
        filter: { field: 'id', op: Operator.EQUALS, val: 1 },
        relations: {
          articles: { },
        },
      })
      sendSuccessResponse(res, server, userWithArticles)
      return
    }

    res.writeHead(404)
    res.end()
  })
  server.listen(3000)
  console.log('Example api listening on http://localhost:3000. Send HTTP GET request to /userProfile/1')
}

init()
