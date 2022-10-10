import { capitalize } from '../helpers/string'
import { ResovledRelationInfo } from './types'

export const createRelationName = (resolvedInfo: ResovledRelationInfo): `${string}${Capitalize<string>}To${Capitalize<string>}${Capitalize<string>}` => (
  // E.g. "userIdToArticleCreatorUserId"
  `${resolvedInfo.leftDataFormat.name}${capitalize(resolvedInfo.leftField.name)}To${capitalize(resolvedInfo.rightDataFormat.name)}${capitalize(resolvedInfo.rightField.name)}`
)
