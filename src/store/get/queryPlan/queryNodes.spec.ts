import { Operator } from '@samhuk/data-filter/dist/types'
import { tsPgOrm } from '../../../testData'
import { toDataNodes } from './dataNodes'
import { toQueryNodes } from './queryNodes'

describe('queryNodes', () => {
  describe('toQueryNodes', () => {
    const fn = toQueryNodes

    test('test 1', () => {
      const dataNodes = toDataNodes(
        tsPgOrm.relations,
        tsPgOrm.dataFormats,
        tsPgOrm.dataFormats.article,
        false,
        {
          fields: ['uuid', 'title', 'dateCreated', 'datePublished'],
          filter: { field: 'dateDeleted', op: Operator.EQUALS, val: null },
          relations: {
            user: {
              relations: {
                userAddress: { },
                recipes: {
                  relations: {
                    image: { },
                  },
                },
              },
            },
          },
        },
      )

      const result = fn(dataNodes)

      expect(result).toBeDefined()
    })
  })
})
