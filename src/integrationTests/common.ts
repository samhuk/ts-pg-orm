/* eslint-disable no-await-in-loop */
import assert from 'assert'
import { Stores } from './orm'
import { addSampleData } from './sampleData'

type TestGroup = (stores: Stores) => Promise<void>
type Test = (stores: Stores) => Promise<void>

const formatPerformanceDtToMs = (dt: number) => parseFloat(dt.toPrecision(5))

const calculateItsPerSec = (numIts: number, dtMs: number) => parseFloat((numIts / (dtMs / 1000)).toPrecision(4))

const calculateMsPerIt = (numIts: number, dtMs: number) => parseFloat((dtMs / numIts).toPrecision(3))

export const reportBenchmark = (numIts: number, fnDtMs: number, controlFnDtMs?: number) => {
  const itsPerSecFn = calculateItsPerSec(numIts, fnDtMs)
  const msPerItFn = calculateMsPerIt(numIts, fnDtMs)
  console.log('its/sec: ', itsPerSecFn)
  console.log('ms/It: ', msPerItFn)
  if (controlFnDtMs != null) {
    const itsPerSecControlFn = calculateItsPerSec(numIts, controlFnDtMs)
    const percentOfControl = (controlFnDtMs / fnDtMs) * 100
    console.log('% of control:', parseFloat(percentOfControl.toPrecision(3)), '%  (control =', itsPerSecControlFn, 'its/sec)')
  }
}

const _benchmarkAsyncFn = async (fn: () => Promise<void>, onComplete: () => void, numIterations: number, i: number = 0) => {
  await fn()
  if (i % 1000 === 0)
    console.log(`Iteration: ${i}/${numIterations} (${(i / numIterations) * 100}%)`)
  if (i < numIterations)
    await _benchmarkAsyncFn(fn, onComplete, numIterations, i + 1)
  else
    onComplete()
}

export const benchmarkAsyncFn = (
  fn: () => Promise<void>,
  controlFn?: () => Promise<void>,
  numIterations: number = 5000,
) => new Promise((res, rej) => {
  if (controlFn != null) {
    const controlFnStart = performance.now()
    _benchmarkAsyncFn(controlFn, () => {
      const fnStart = performance.now()
      _benchmarkAsyncFn(fn, () => {
        reportBenchmark(numIterations, performance.now() - fnStart, fnStart - controlFnStart)
        res(undefined)
      }, numIterations)
    }, numIterations)
  }
  else {
    const start = performance.now()
    _benchmarkAsyncFn(fn, () => {
      reportBenchmark(numIterations, performance.now() - start)
      res(undefined)
    }, numIterations)
  }
})

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
    assert.deepStrictEqual(actual, expected, message)
  }
  const timedFnResult = await timedFn(() => fn(stores, _assert))
  console.log('Done. Dt (ms):', formatPerformanceDtToMs(timedFnResult.dt))
}

export const deleteAllSampleData = async (stores: Stores) => {
  await stores.userIdToUserGroupId.delete()
  await stores.article.delete()
  await stores.image.delete()
  await stores.userAddress.delete()
  await stores.userGroup.delete()
  await stores.user.delete()
}

const executeTest = async (stores: Stores, tests: Test[], onComplete: () => void, i: number = 0) => {
  await deleteAllSampleData(stores)
  await addSampleData(stores)
  await tests[i](stores)
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

const executeTestGroup = async (stores: Stores, testGroups: TestGroup[], onComplete: () => void, i: number = 0) => {
  await testGroups[i](stores)
  if (i < testGroups.length - 1)
    await executeTestGroup(stores, testGroups, onComplete, i + 1)
  else
    onComplete()
}

export const executeTestGroups = (stores: Stores, ...testGroups: TestGroup[]) => new Promise((res, rej) => {
  executeTestGroup(stores, testGroups, () => res(null))
})
