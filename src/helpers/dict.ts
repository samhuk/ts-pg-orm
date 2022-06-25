export const convertListToStringIndexedDict = <T extends any>(
  list: T[],
  entryCreator: (item: T) => [string, T],
) => {
  const dict: { [k: string]: T } = { }

  list.forEach(item => {
    const entry = entryCreator(item)
    dict[entry[0]] = entry[1]
  })

  return dict
}

export const convertListToNumberIndexedDict = <T extends any>(
  list: T[],
  entryCreator: (item: T) => [number, T],
) => {
  const dict: { [k: number]: T } = { }

  list.forEach(item => {
    const entry = entryCreator(item)
    dict[entry[0]] = entry[1]
  })

  return dict
}

export const pushToArrayOfPropertyName = <T extends any>(dict: { [k: string]: T[] }, key: string, item: T) => {
  if (dict[key] == null)
    // eslint-disable-next-line no-param-reassign
    dict[key] = []

  dict[key].push(item)
}

export const mapDict = <T extends any, R extends any>(
  dict: { [k: string]: T },
  map: (item: T, key: string, i: number) => R,
) => {
  const mapped: { [key: string]: R } = {}
  let i = 0
  Object.entries(dict).forEach(([key, value]) => {
    mapped[key] = map(value, key, i)
    i += 1
  })
  return mapped
}

export const toDict = <TArrayValue, TDictKeys extends string|number, TDictValue>(
  array: TArrayValue[],
  selector: (item: TArrayValue, i: number) => ({ key: TDictKeys, value: TDictValue }),
): { [key in TDictKeys]: TDictValue } => {
  const dict: { [key in TDictKeys]: TDictValue } = {} as { [key in TDictKeys]: TDictValue }
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
  const dict: { [key in TDictKeys]: TDictValue } = {} as { [key in TDictKeys]: TDictValue }
  array.forEach((item, i) => {
    const { key, value } = selector(item, i)
    dict[key] = value
  })
  return dict
}
