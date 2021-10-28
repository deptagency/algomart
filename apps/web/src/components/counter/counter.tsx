import useTranslation from 'next-translate/useTranslation'
import { useEffect, useState } from 'react'

import CounterDigit from './counter-digit'

interface CounterProps {
  includeDaysInPlainString?: boolean
  plainString?: boolean
  target: Date
}

export default function Counter({
  includeDaysInPlainString,
  plainString,
  target,
}: CounterProps) {
  const [now, setNow] = useState(new Date())
  const { t } = useTranslation()

  const diffInMilliseconds = Math.max(target.getTime() - now.getTime(), 0)
  const pause = diffInMilliseconds === 0
  const days = Math.floor(diffInMilliseconds / 1000 / 60 / 60 / 24)
  const hours = Math.floor((diffInMilliseconds / 1000 / 60 / 60) % 24)
  const minutes = Math.floor((diffInMilliseconds / 1000 / 60) % 60)
  const seconds = Math.floor((diffInMilliseconds / 1000) % 60)

  useEffect(() => {
    if (pause) {
      return
    }

    const timer = setInterval(() => {
      setNow(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [pause])

  if (plainString) {
    return days > 0 && !includeDaysInPlainString ? (
      <span suppressHydrationWarning>
        {days} {t('common:dateTime.Days', { count: days })}
      </span>
    ) : (
      <span suppressHydrationWarning>
        {includeDaysInPlainString && <>{t('common:dateTime.d', { days })} </>}
        {t('common:dateTime.h', { hours })}{' '}
        {t('common:dateTime.m', { minutes })}{' '}
        {t('common:dateTime.s', { seconds })}
      </span>
    )
  }

  return (
    <div className="flex justify-between space-x-3 md:space-x-5 md:justify-start">
      <CounterDigit
        digit={days}
        label={t('common:dateTime.Days', { count: days })}
      />
      <CounterDigit
        digit={hours}
        label={t('common:dateTime.Hours', { count: hours })}
      />
      <CounterDigit
        digit={minutes}
        label={t('common:dateTime.Minutes', { count: minutes })}
      />
      <CounterDigit
        digit={seconds}
        label={t('common:dateTime.Seconds', { count: seconds })}
      />
    </div>
  )
}
