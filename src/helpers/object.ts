/**
 * Recursively removes all properties within `obj` that begin with `prefix`.
 *
 * @example
 * deepRemovePropsWithPrefix({ $a: 1, b: { $c: 2 } }, '$') // { b: { } }
 */
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
