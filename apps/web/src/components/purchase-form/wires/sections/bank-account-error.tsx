import { ExclamationCircleIcon } from '@heroicons/react/outline'
import useTranslation from 'next-translate/useTranslation'

import css from './bank-account-error.module.css'

import Button from '@/components/button'
import Heading from '@/components/heading'

export interface BankAccountErrorProps {
  error?: string
  handleRetry: () => void
}

export default function BankAccountError({
  error,
  handleRetry,
}: BankAccountErrorProps) {
  const { t } = useTranslation()

  return (
    <div className={css.root}>
      <ExclamationCircleIcon className={css.icon} />
      <Heading className={css.heading} level={3}>
        {t('release:failedToCreateBank')}
      </Heading>
      {error && <p className={css.message}>{error}</p>}
      <Button className={css.button} onClick={handleRetry} size="small">
        {t('common:actions.Try Again')}
      </Button>
    </div>
  )
}
