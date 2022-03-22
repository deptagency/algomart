export const poll = async function <T>(
  func: () => Promise<T>,
  funcCondition: (result: T) => boolean,
  ms: number
) {
  let result = await func()
  while (funcCondition(result)) {
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
