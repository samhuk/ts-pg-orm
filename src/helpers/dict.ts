export const mapDict = <T extends any, R extends any>(
  dict: { [k: string]: T },
  map: (item: T, key: string, i: number) => R,
): { [key: string]: R } => {
  if (dict == null)
    return null

  // @ts-ignore TODO: This fails on remote with TS error
  if (dict === {})
    return {}

  const mapped: { [key: string]: R } = {}
  let i = 0
  Object.entries(dict).forEach(([key, value]) => {
    mapped[key] = map(value, key, i)
    i += 1
  })
  return mapped
}

export const toDict = <TArrayValue = any, TDictKeys extends string|number = string, TDictValue = any>(
  array: TArrayValue[],
  selector: (item: TArrayValue, i: number) => ({ key: TDictKeys, value: TDictValue }),
): { [key in TDictKeys]: TDictValue } => {
  if (array == null)
    return null

  // @ts-ignore TODO: This fails on remote with TS error
  if (array === [])
    return {} as { [key in TDictKeys]: TDictValue }

  const dict = {} as { [key in TDictKeys]: TDictValue }
  array.forEach((item, i) => {
    const { key, value } = selector(item, i)
    dict[key] = value
  })
  return dict
}

export const toDictReadonly = <TArrayValue, TDictKeys extends string|number, TDictValue>(
  array: Readonly<TArrayValue[]>,
  selector: (item: TArrayValue, i: number) => ({ key: TDictKeys, value: TDictValue }),
): { [key in TDictKeys]: TDictValue } => {
  if (array == null)
    return null

  // @ts-ignore TODO: This fails on remote with TS error
  if (array === [])
    return {} as { [key in TDictKeys]: TDictValue }

  const dict = {} as { [key in TDictKeys]: TDictValue }
  array.forEach((item, i) => {
    const { key, value } = selector(item, i)
    dict[key] = value
  })
  return dict
}
