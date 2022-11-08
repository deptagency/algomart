export function exponentialThenDailyBackoff(attemptsMade: number) {
  const initialBackoffMs = 2000
  const exponentialBackoffMs = Math.pow(2, attemptsMade - 1) * initialBackoffMs

  const dailyBackoffMs = 1000 * 60 * 60 * 24

  // after 12 attempts the exponential would be 2h+, switch to daily.
  return attemptsMade > 12 ? dailyBackoffMs : exponentialBackoffMs
}
exponentialThenDailyBackoff.type = 'exponentialThenDaily'
exponentialThenDailyBackoff.recommendedAttempts = 15

// once per second for 60s,
// then once per minute for the next 10 minutes,
// then once per hour for 24 hours
// then daily
export function circlePollingBackoff(attemptsMade: number) {
  const oneSecondMs = 1000
  const oneMinuteMs = 1000 * 60
  const oneHourMs = oneMinuteMs * 60
  const dailyMs = oneHourMs * 24

  if (attemptsMade < 60) {
    return oneSecondMs
  } else if (attemptsMade < 70) {
    return oneMinuteMs
  } else if (attemptsMade < 94) {
    return oneHourMs
  } else {
    return dailyMs
  }
}
circlePollingBackoff.type = 'circlePolling'
circlePollingBackoff.recommendedAttempts = 97
