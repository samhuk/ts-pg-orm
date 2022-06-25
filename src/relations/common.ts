import { FieldRef } from '../dataFormat/types'
import { RelationDeclaration, RelationType } from './types'

const createRelationDeclaration = <T extends RelationDeclaration>(d: T): T => d

/**
 * Creates a one-to-many relation from a "user" data format's "id" field
 * to the given field reference.
 *
 * @example
 * createDefaultOneToManyRelationFromUser({
 *   formatName: 'recipe',
 *   fieldName: 'createdByUserId',
 * })
 */
export const createDefaultOneToManyRelationFromUserGroup = <T extends FieldRef>(
  toFieldRef: T,
) => createRelationDeclaration({
  type: RelationType.ONE_TO_MANY,
  fromOneField: {
    formatName: 'userGroup',
    fieldName: 'id',
  },
  toManyField: toFieldRef,
} as const)

/**
 * Creates a one-to-many relation from a "user" data format's "id" field
 * to the given field reference.
 *
 * @example
 * createDefaultOneToManyRelationFromUser({
 *   formatName: 'recipe',
 *   fieldName: 'createdByUserId',
 * })
 */
export const createDefaultOneToManyRelationFromUser = <T extends FieldRef>(
  toFieldRef: T,
) => createRelationDeclaration({
  type: RelationType.ONE_TO_MANY,
  fromOneField: {
    formatName: 'user',
    fieldName: 'id',
  },
  toManyField: toFieldRef,
} as const)

/**
 * Creates a default many-to-many relation between the given formats, using their
 * "id" field.
 */
export const createDefaultManyToManyRelation = <T extends string, K extends string>(
  formatName1: T,
  formatName2: K,
) => createRelationDeclaration({
  type: RelationType.MANY_TO_MANY,
  fieldRef1: {
    formatName: formatName1,
    fieldName: 'id',
  },
  fieldRef2: {
    formatName: formatName2,
    fieldName: 'id',
  },

} as const)
