export function isAfterNow(date: Date) {
  const now = new Date()
  return date.getTime() > now.getTime()
}

export function isNowBetweenDates(dateStart: Date, dateEnd: Date) {
  const now = new Date()
  return (
    dateStart.getTime() < now.getTime() && now.getTime() < dateEnd.getTime()
  )
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}
