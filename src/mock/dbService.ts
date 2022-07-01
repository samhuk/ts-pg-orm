import { DbService } from '../types'

export type MockDbService = DbService & {
  queuedResponses: any[]
  queueResponse: (response: any) => void
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

  return instance = {
    queuedResponses: [],
    queueResponse: response => instance.queuedResponses.push(response),

    receivedQueries: [],
    clearReceivedQueries: () => instance.receivedQueries = [],

    query: sendResponse,
    queryGetRows: sendResponse,
    queryGetFirstRow: sendResponse,
  }
}
