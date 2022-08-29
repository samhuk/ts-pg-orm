export const removeDuplicates = <T>(array: T[]): T[] => {
  if (array == null)
    return null

  if (array.length === 0)
    return []

  return array.reduce((acc, item) => (
    acc.indexOf(item) === -1 ? acc.concat(item) : acc
  ), [])
}

export const removeNullAndUndefinedValues = <T>(array: T[]): T[] => {
  if (array == null)
    return null

  if (array.length === 0)
    return []

  return array.filter(item => item != null)
}
