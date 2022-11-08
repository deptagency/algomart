import useTranslation from 'next-translate/useTranslation'
import { useMemo, useState } from 'react'

import Grid from '../grid/grid'

import CounterDigit from './counter-digit'

import { useInterval } from '@/hooks/use-interval'
import { getTimeDiff } from '@/utils/date-time'

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

  const { days, hours, minutes, seconds, diffInMilliseconds } = useMemo(
    () => getTimeDiff(target, now),
    [now, target]
  )
  const pause = diffInMilliseconds === 0

  useInterval(
    () => {
      setNow(new Date())
    },
    pause ? null : 1000
  )

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
    <Grid base={4} gapBase={5} className={'mx-2'}>
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
    </Grid>
  )
}
