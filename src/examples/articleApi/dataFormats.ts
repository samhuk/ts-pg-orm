// ------------------------------------------------------------------
// This file defines the data formats of the app. These are loaded
// to create Entities in ./entities.ts
// ------------------------------------------------------------------

import { createDataFormatDeclaration } from '../../dataFormat'
import { BASE_ENTITY_FIELDS, COMMON_FIELDS } from '../../dataFormat/common'
import { DataType, StringDataSubType } from '../../dataFormat/types'

/**
 * User Data Format Declaration
 */
export const USER_DFD = createDataFormatDeclaration({
  name: 'user',
  fields: [
    // Provide id, uuid, dateCreated, and dateDeleted fields
    ...BASE_ENTITY_FIELDS,
    // 50-character varying name field
    COMMON_FIELDS.name50,
  ],
} as const)

/**
 * User Article Data Format Declaration
 */
export const USER_ARTICLE_DFD = createDataFormatDeclaration({
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
