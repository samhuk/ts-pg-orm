export const setObjPropDeep = (obj: any, propPath: string[], value: any, createIfNotExists: boolean = false) => {
  let currentObj = obj
  for (let i = 0; i < propPath.length; i += 1) {
    if (i === propPath.length - 1) {
      currentObj[propPath[i]] = value
      return obj
    }

    if (currentObj[propPath[i]] == null && createIfNotExists)
      currentObj[propPath[i]] = {}

    currentObj = currentObj[propPath[i]]
  }

  return obj
}

export const readObjPropDeep = (obj: any, propPath: string[]) => {
  let currentObj = obj
  for (let i = 0; i < propPath.length; i += 1) {
    if (i === propPath.length - 1)
      return currentObj[propPath[i]]

    if (currentObj[propPath[i]] == null)
      return undefined

    currentObj = currentObj[propPath[i]]
  }

  return obj
}
