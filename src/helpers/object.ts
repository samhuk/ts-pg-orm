export const deepRemovePropsWithPrefix = (obj: any, prefix: string) => {
  if (obj == null)
    return

  Object.keys(obj).forEach(prop => {
    if (prop.startsWith(prefix))
      delete obj[prop]
    else if (typeof obj[prop] === 'object')
      deepRemovePropsWithPrefix(obj[prop], prefix)
  })
}
