/**
 * Polls a function repeatedly until the predicate returns false or until the function throws an error.
 * @param func Function to be called repeatedly.
 * @param predicate As long as this returns true, the function will be called again.
 * @param ms How often to repeat the function in milliseconds.
 * @returns Returns a promise that eventually resolves to the last value returned by the function.
 */
export const poll = async function <T>(
  func: () => Promise<T>,
  predicate: (result: T) => boolean,
  ms: number
) {
  let result = await func()
  while (predicate(result)) {
    await wait(ms)
    result = await func()
  }
  return result
}

const wait = function (ms = 1000) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
