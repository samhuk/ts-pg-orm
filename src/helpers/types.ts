export type Dict<T = any> = { [key: string]: T }

/**
 * For creating types like:
 *
 * @example
 * enum Type { STRING, NUMBER }
 * type Map = {
 *   [Type.STRING]: { upperCase: string },
 *   [Type.NUMBER]: { isInteger: boolean },
 * }
 * type Field = TypeDependantBaseIntersection<Type, Map, "dataType", "dataTypeOptions">
 * const field1: Field = {
 *   dataType: Type.STRING,
 *   dataTypeOptions: {
 *     upperCase: false
 *   }
 * }
 */
export type TypeDependantBase<
  TType extends string|number,
  TMap extends { [k in TType]: any },
  TTypePropertyName extends string = 'type',
  TTypeOptionsPropertyName extends string = 'typeOptions'
> = {
  [K in TType]: { [k in TTypePropertyName]: K } & { [k in TTypeOptionsPropertyName]: TMap[K] }
}[TType] & { [k in TTypePropertyName]: TType }

/**
 * For creating types like:
 *
 * @example
 * enum Type { STRING, NUMBER }
 * type Map = {
 *   [Type.STRING]: { upperCase: string },
 *   [Type.NUMBER]: { isInteger: boolean },
 * }
 * type Field = TypeDependantBaseIntersection<Type, Map, "dataType">
 * const field1: Field = {
 *   dataType: Type.STRING,
 *   upperCase: false
 * }
 */
export type TypeDependantBaseIntersection<
  TType extends string|number,
  TMap extends { [k in TType]: any },
  TSpecificEnumType extends string|number = TType,
  TTypePropertyName extends string = 'type',
> = {
  [K in TType]: { [k in TTypePropertyName]: K } & TMap[K]
}[TType] & { [k in TTypePropertyName]: TSpecificEnumType }

export type DefaultPluralize<T extends string> = `${T}s`

/**
 * Removes all of the `readonly` status of all the properties within `T`.
 */
export type Mutable<T> = { -readonly [K in keyof T]: T[K] }

export type DeepMutable<T> =
  T extends (infer R)[] ? DeepMutableArray<R> :
  T extends Function ? T :
  T extends object ? DeepMutableObject<T> :
  T

interface DeepMutableArray<T> extends Array<DeepMutable<T>> {}

type DeepMutableObject<T> = {
  -readonly [P in keyof T]: DeepMutable<T[P]>
}

/**
 * Makes `T` either readonly or mutable.
 */
export type ReadonlyOrMutable<T> = Readonly<T> | Mutable<T>

export type DeepReadonlyOrMutable<T> = DeepReadonly<T> | DeepMutable<T>

/*
 * Forces typescript to expand the first level of the type definition of `T`. Be warned,
 * this can make TS not recognise your types properly, in some cases.
 */
export type ExpandOneLevel<T> = T extends object
 ? T extends infer O ? { [K in keyof O]: O[K] } : never
 : T;

/**
 * Forces typescript to recursively expand the type definition of `T`.
 */
export type ExpandRecursively<T> = T extends object
  ? T extends infer O ? { [K in keyof O]: ExpandRecursively<O[K]> } : never
  : T;

export type DeepReadonly<T> =
  T extends (infer R)[] ? DeepReadonlyArray<R> :
  T extends Function ? T :
  T extends object ? DeepReadonlyObject<T> :
  T

export interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}

type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>
}

/**
 * A version of typescript's standard `Pick<T, K>` that allows any `K`,
 * similar to how `Omit<T, K>` allows any `K`.
 */
export type PickAny<T, K extends keyof any> = Pick<T, Extract<keyof T, K>>

/**
 * A version of typescript's standard `Omit<T, K` where `K` is forced to
 * be a key in `T`, instead of anything as is the case with `Omit`.
 */
export type OmitTyped<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

/**
 * Creates a union of all the values within the given dict type
 */
export type ValuesUnionFromDict<TDict> = TDict[keyof TDict]

export type ArrayTernary<T, TIsArray extends boolean> = TIsArray extends false ? T : T[]

type IfAny<T, Y, N> = 0 extends (1 & T) ? Y : N

export type IsAny<T> = IfAny<T, true, false>
