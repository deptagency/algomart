import { exponentialThenDailyBackoff } from './bull-mq'

test('exponentialThenDelay backoff function', () => {
  const exponentialDelay = 2000
  const dailyDelay = 1000 * 60 * 60 * 24
  for (let attempt = 1; attempt <= 12; attempt++) {
    expect(exponentialThenDailyBackoff(attempt)).toBe(
      Math.pow(2, attempt - 1) * exponentialDelay
    )
  }
  const attempt = 13
  expect(exponentialThenDailyBackoff(attempt + 1)).toBe(dailyDelay)
})
