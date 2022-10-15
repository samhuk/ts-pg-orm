/* eslint-disable no-await-in-loop */
import assert from 'assert'
import { ConnectedOrm, Stores } from '../test/orm'
import { addSampleData } from './sampleData'

type TestGroup = (orm: ConnectedOrm) => Promise<void>
type Test = (orm: ConnectedOrm) => Promise<void>
type BenchmarkResult = { itsPerSec: number, msPerIt: number, itsPerSecControl?: number, percentOfControl?: number }

const formatPerformanceDtToMs = (dt: number) => parseFloat(dt.toPrecision(5))

const calculateItsPerSec = (numIts: number, dtMs: number) => parseFloat((numIts / (dtMs / 1000)).toPrecision(4))

const calculateMsPerIt = (numIts: number, dtMs: number) => parseFloat((dtMs / numIts).toPrecision(3))

export const createBenchmarkResult = (numIts: number, fnDtMs: number, controlFnDtMs?: number): BenchmarkResult => ({
  itsPerSec: calculateItsPerSec(numIts, fnDtMs),
  msPerIt: calculateMsPerIt(numIts, fnDtMs),
  itsPerSecControl: controlFnDtMs != null ? calculateItsPerSec(numIts, controlFnDtMs) : null,
  percentOfControl: controlFnDtMs != null ? (controlFnDtMs / fnDtMs) * 100 : null,
})

export const reportBenchmarkResult = (result: BenchmarkResult) => {
  console.log('its/sec: ', result.itsPerSec)
  console.log('ms/It: ', result.msPerIt)
  if (result.itsPerSecControl != null)
    console.log('% of control:', parseFloat(result.percentOfControl.toPrecision(3)), '%  (control =', result.itsPerSecControl, 'its/sec)')
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
) => new Promise<BenchmarkResult>((res, rej) => {
  if (controlFn != null) {
    const controlFnStart = performance.now()
    _benchmarkAsyncFn(controlFn, () => {
      const fnStart = performance.now()
      _benchmarkAsyncFn(fn, () => {
        const result = createBenchmarkResult(numIterations, performance.now() - fnStart, fnStart - controlFnStart)
        reportBenchmarkResult(result)
        res(result)
      }, numIterations)
    }, numIterations)
  }
  else {
    const start = performance.now()
    _benchmarkAsyncFn(fn, () => {
      const result = createBenchmarkResult(numIterations, performance.now() - start)
      reportBenchmarkResult(result)
      res(result)
    }, numIterations)
  }
})

export const timedFn = async <T>(fn: () => Promise<T> | T): Promise<{ dt: number, result: T }> => {
  const start = performance.now()
  let end: number = 0
  const result = await fn()
  end = performance.now()
  const dt = end - start
  return { dt, result }
}

export const test = (
  name: string,
  fn: (orm: ConnectedOrm, assert: (actual: any, expected: any, message?: string) => void) => Promise<void>,
): Test => async (orm: ConnectedOrm) => {
  console.log(`Running test: ${name}`)
  const _assert = (actual: any, expected: any, message?: string): any => {
    assert.deepStrictEqual(actual, expected, message)
  }
  const timedFnResult = await timedFn(() => fn(orm, _assert))
  console.log('Done. Dt (ms):', formatPerformanceDtToMs(timedFnResult.dt))
}

export const deleteAllSampleData = async (stores: Stores) => {
  await stores.userIdToUserGroupId.delete()
  await stores.userPreferences.delete()
  await stores.article.delete()
  await stores.image.delete()
  await stores.userAddress.delete()
  await stores.userGroup.delete()
  await stores.user.delete()
}

const executeTest = async (orm: ConnectedOrm, tests: Test[], onComplete: () => void, i: number = 0) => {
  await deleteAllSampleData(orm.stores)
  await addSampleData(orm.stores)
  await tests[i](orm)
  if (i < tests.length - 1)
    await executeTest(orm, tests, onComplete, i + 1)
  else
    onComplete()
}

export const testGroup = (
  name: string,
  ...tests: Test[]
): TestGroup => (orm: ConnectedOrm) => {
  console.log(`Running test group: ${name}`)
  return new Promise((res, rej) => {
    executeTest(orm, tests, () => res())
  })
}

const executeTestGroup = async (orm: ConnectedOrm, testGroups: TestGroup[], onComplete: () => void, i: number = 0) => {
  await testGroups[i](orm)
  if (i < testGroups.length - 1)
    await executeTestGroup(orm, testGroups, onComplete, i + 1)
  else
    onComplete()
}

export const executeTestGroups = (orm: ConnectedOrm, ...testGroups: TestGroup[]) => new Promise((res, rej) => {
  executeTestGroup(orm, testGroups, () => res(null))
})
