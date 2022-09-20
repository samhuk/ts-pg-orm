/* eslint-disable no-await-in-loop */
import assert from 'assert'
import { Stores } from './orm'
import { addSampleData } from './sampleData'

type TestGroup = (stores: Stores) => Promise<void>
type Test = (stores: Stores) => Promise<void>

const formatPerformanceDtToMs = (dt: number) => parseFloat(dt.toPrecision(6))

export const timedFn = async <T>(fn: () => Promise<T> | T): Promise<{ dt: number, result: T }> => {
  const start = performance.now()
  let end: number = null
  const result = await fn()
  end = performance.now()
  const dt = end - start
  return { dt, result }
}

export const test = (
  name: string,
  fn: (stores: Stores, assert: (actual: any, expected: any, message?: string) => void) => Promise<void>,
): Test => async (stores: Stores) => {
  console.log(`Running test: ${name}`)
  const _assert = (actual: any, expected: any, message?: string): any => {
    try {
      assert.deepStrictEqual(actual, expected, message)
    }
    catch (error) {
      console.log('Test failed: ', error)
      throw error
    }
  }
  const timedFnResult = await timedFn(() => fn(stores, _assert))
  console.log('Done. Dt (ms):', formatPerformanceDtToMs(timedFnResult.dt))
}

export const deleteAllSampleData = async (stores: Stores) => {
  await stores['user.id <<-->> userGroup.id'].delete()
  await stores.article.delete()
  await stores.image.delete()
  await stores.userAddress.delete()
  await stores.userGroup.delete()
  await stores.user.delete()
}

const executeTest = async (stores: Stores, tests: Test[], onComplete: () => void, i: number = 0) => {
  await addSampleData(stores)
  await tests[i](stores)
  await deleteAllSampleData(stores)
  if (i < tests.length - 1)
    await executeTest(stores, tests, onComplete, i + 1)
  else
    onComplete()
}

export const testGroup = (
  name: string,
  ...tests: Test[]
): TestGroup => (stores: Stores) => {
  console.log(`Running test group: ${name}`)
  return new Promise((res, rej) => {
    executeTest(stores, tests, () => res())
  })
}