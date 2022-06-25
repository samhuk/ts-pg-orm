import { Dict } from './types'

/**
 * @example
 * getLastPathSegment('a/b/c') // 'c'
 */
export const getLastPathSegment = (path: string) => (
  path.substring(path.lastIndexOf('/') + 1)
)

/**
 * @example
 * camelCaseToSnakeCase('dateCreated') // date_created
 */
export const camelCaseToSnakeCase = (s: string) => s.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`)

/**
 * @example
 * camelCaseToSnakeCase('date_created') // dateCreated
 */
export const snakeCaseToCamelCase = (s: string) => s.replace(/_([a-z0-9])/g, (_, g1) => `${g1.toUpperCase()}`)

export const camelCaseToTitleCase = (s: string) => s.replace(/^[a-z]|[A-Z]/g, m => ` ${m.toUpperCase()}`).trimStart()

/**
 * @example
 * objectPropsToCamelCase({ name: 'a', date_created: ... }) // { name: 'a', dateCreated: ... }
 */
export const objectPropsToCamelCase = <TInput extends Dict, TOutput extends Dict>(inputObject: TInput) => {
  if (inputObject == null)
    return null

  const outputObject: Dict = { }
  Object.entries(inputObject).forEach(([k, v]) => {
    outputObject[snakeCaseToCamelCase(k)] = v
  })
  return outputObject as TOutput
}

/**
 * @example
 * objectPropsToSnakeCase({ name: 'a', dateCreated: ... }) // { name: 'a', date_created: ... }
 */
export const objectPropsToSnakeCase = <TInput extends Dict, TOutput extends Dict>(inputObject: TInput) => {
  const outputObject: Dict = { }
  Object.entries(inputObject).forEach(([k, v]) => {
    outputObject[camelCaseToSnakeCase(k)] = v
  })
  return outputObject as TOutput
}

export const capitalize = <T extends string>(s: T): Capitalize<T> => (
  `${s.charAt(0).toUpperCase()}${s.slice(1)}` as Capitalize<T>
)
