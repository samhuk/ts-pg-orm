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
 * quote('hello') '"hello"'
 */
export const quote = (s: string): string => `"${s}"`

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

/**
 * @example
 * capitalize('hello') 'Hello'
 */
export const capitalize = <T extends string>(s: T): Capitalize<T> => (
  `${s.charAt(0).toUpperCase()}${s.slice(1)}` as Capitalize<T>
)

/**
 * Removes null, undefined, and empty strings from `arr`.
 *
 * @example
 * filterForNotNullAndEmpty([1, null, 2, undefined, 3]) [1, 2, 3]
 */
export const filterForNotNullAndEmpty = (arr: string[]) => (
  arr.filter(s => s != null && s.length > 0)
)

/**
 * Concatenates the list of strings - `arr`, if and only if `arr` is defined and has
 * at least one entry.
 *
 * @example
 * joinIfhasEntries(null, ' and ') null
 * joinIfhasEntries([], ' and ') null
 * joinIfhasEntries(['hello'], ' and ') 'hello'
 * joinIfhasEntries(['hello', 'bye'], ' and ') 'hello and bye'
 */
export const joinIfhasEntries = (arr: string[], joinStr: string) => (
  arr != null && arr.length > 0 ? arr.join(joinStr) : null
)

/**
 * Concatenates `prefix` and `suffix` together if and only if both of them are defined.
 *
 * @example
 * concatIfNotNullAndEmpty(null, null) null
 * concatIfNotNullAndEmpty('a', null) null
 * concatIfNotNullAndEmpty(null, 'b') null
 * concatIfNotNullAndEmpty('a', 'b') 'ab'
 */
export const concatIfNotNullAndEmpty = (prefix: string, suffix: string) => {
  if (prefix != null && suffix != null)
    return prefix.concat(suffix)

  return null
}
