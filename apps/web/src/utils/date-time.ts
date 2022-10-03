export function isAfterNow(date: Date) {
  const now = new Date()
  return date > now
}

export function isAfterDate(date1: Date, date2: Date) {
  return date1 > date2
}

export function isBeforeNow(date: Date) {
  return date < new Date()
}

export function isNowBetweenDates(dateStart: Date, dateEnd: Date) {
  const now = new Date()
  return dateStart < now && now < dateEnd
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

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

export function getTimeDiff(date: Date, now = new Date()) {
  const diffInMilliseconds = Math.max(date.getTime() - now.getTime(), 0)
  const days = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffInMilliseconds / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diffInMilliseconds / 1000 / 60) % 60)
  const seconds = Math.floor((diffInMilliseconds / 1000) % 60)
  return { days, hours, minutes, seconds, diffInMilliseconds }
}
