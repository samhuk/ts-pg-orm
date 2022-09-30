import { Operator } from '@samhuk/data-filter/dist/types'
import { tsPgOrm } from '../../../testData'
import { toDataNodes } from './dataNodes'

describe('dataNodes', () => {
  describe('toDataNodes', () => {
    const fn = toDataNodes

    test('test 1', () => {
      const result = fn(
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

      expect(result).toBeDefined()
    })
  })
})
