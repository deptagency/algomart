import { ExclamationCircleIcon } from '@heroicons/react/outline'
import useTranslation from 'next-translate/useTranslation'

import css from './failure.module.css'

import Button from '@/components/button'
import { H1 } from '@/components/heading'

export default function KYCFailure({ handleRetry }: { handleRetry(): void }) {
  const { t } = useTranslation()
  return (
    <div className={css.root}>
      <ExclamationCircleIcon className={css.icon} />
      <H1 mb={16}>{t('common:statuses.An Error has Occurred')}</H1>
      <Button className={css.button} onClick={handleRetry} size="small">
        {t('common:actions.Try Again')}
      </Button>
    </div>
  )
}
