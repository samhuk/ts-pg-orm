/* This is the entrypoint ts file for the component.
 */

import { MyComponentOptions, MyComponent } from './types'

export const createMyComponent = (options: MyComponentOptions): MyComponent => {
  let component: MyComponent

  return component = {
    foo: options.initialFoo,
    updateFoo: newFoo => component.foo = newFoo,
  }
}
