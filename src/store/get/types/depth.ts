/**
 * `MaxDepth` specifies how deep the type compilation
 * will go with recursive relations for get functions.
 *
 * Empirically, 3 is found to most reliably avoid Typescript's
 * "type inference is too deep" error.
 */
export type MaxDepth = 3

/**
 * `Prev` converts the given integer type to 1 less than itself.
 *
 * @example
 * type MyPrev = Prev[2] // MyPrev = 1
 */
export type Prev = [never, 0, 1, 2, 3]
