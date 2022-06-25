/**
 * Options for the creation of MyComponent
 */
export type MyComponentOptions = {
  initialFoo: string
}

export type MyComponent = {
  foo: string
  updateFoo: (newFoo: string) => string
}
