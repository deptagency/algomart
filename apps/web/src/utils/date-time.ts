export function isAfterNow(date: Date) {
  const now = new Date()
  return date.getTime() > now.getTime()
}

export function isAfterDate(date1: Date, date2: Date) {
  return date1.getTime() > date2.getTime()
}

export function isNowBetweenDates(dateStart: Date, dateEnd: Date) {
  const now = new Date()
  return (
    dateStart.getTime() < now.getTime() && now.getTime() < dateEnd.getTime()
  )
}

export function getExpirationDate(expMonth: string, expYear: string) {
  const yearPrefix = new Date().getFullYear().toString().slice(0, 2)
  let year = expYear
  if (expYear.length === 2) {
    year = yearPrefix + expYear
  }
  const expiration = new Date()
  expiration.setDate(1)
  expiration.setMonth(Number.parseFloat(expMonth) - 1)
  expiration.setFullYear(Number.parseFloat(year))
  return expiration
}
