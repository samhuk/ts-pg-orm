import { SimplePgClient } from 'simple-pg-client/dist/types'

export type MockDbService = SimplePgClient & {
  queuedResponses: any[]
  queueResponse: (response: any) => void
  queueResponses: (responses: any[]) => void
  receivedQueries: { sql: string, parameters?: any[] }[]
  clearReceivedQueries: () => void
}

export const createMockDbService = (): MockDbService => {
  let instance: MockDbService
  let i = -1

  const sendResponse = (sql: string, parameters: string[]) => {
    // eslint-disable-next-line no-multi-assign
    const j = i += 1
    instance.receivedQueries.push({ sql, parameters })
    return Promise.resolve(instance.queuedResponses[j])
  }

  const queueResponse = (r: any) => instance.queuedResponses.push(r)

  return instance = {
    client: null,
    queuedResponses: [],
    queueResponse,
    queueResponses: responses => responses.forEach(queueResponse),

    receivedQueries: [],
    clearReceivedQueries: () => instance.receivedQueries = [],

    query: sendResponse,
    queryExists: sendResponse,
    queryGetRows: sendResponse,
    queryGetFirstRow: sendResponse,
  }
}
