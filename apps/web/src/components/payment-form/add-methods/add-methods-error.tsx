import { ExclamationCircleIcon } from '@heroicons/react/outline'
import useTranslation from 'next-translate/useTranslation'

import css from './add-methods-error.module.css'

import Button from '@/components/button'
import { H2 } from '@/components/heading'

export default function AddMethodsError({
  error,
  handleRetry,
}: {
  handleRetry(): void
  error?: string
}) {
  const { t } = useTranslation()
  return (
    <div className={css.root}>
      <ExclamationCircleIcon className={css.icon} />
      <H2 bold mb={8} size={1}>
        {t('common:statuses.An Error has Occurred')}
      </H2>
      <p className={css.message}>{t('forms:errors.failedCardCreation')}</p>
      <Button className={css.button} onClick={handleRetry}>
        {t('common:actions.Try Again')}
      </Button>
    </div>
  )
}
