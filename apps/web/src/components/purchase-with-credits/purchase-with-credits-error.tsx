import { ExclamationCircleIcon } from '@heroicons/react/outline'
import useTranslation from 'next-translate/useTranslation'

import css from './purchase-with-credits-error.module.css'

import Button from '@/components/button'
import { H2 } from '@/components/heading'

export interface PurchaseWithCreditsErrorProps {
  errorLabel?: string
  handleRetry: () => void
}

export default function PurchaseWithCreditsError({
  errorLabel,
  handleRetry,
}: PurchaseWithCreditsErrorProps) {
  const { t } = useTranslation()

  return (
    <div className={css.root}>
      <ExclamationCircleIcon className={css.icon} strokeWidth={1.5} />
      <H2 my={4} size={3}>
        {errorLabel}
      </H2>
      <p className={css.message}>{t('forms:errors.failedPurchase')}</p>
      <Button className={css.button} onClick={handleRetry} size="small">
        {t('common:actions.Try Again')}
      </Button>
    </div>
  )
}
