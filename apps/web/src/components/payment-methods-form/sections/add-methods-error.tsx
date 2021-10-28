import { ExclamationCircleIcon } from '@heroicons/react/outline'
import useTranslation from 'next-translate/useTranslation'

import css from './add-methods-error.module.css'

import Button from '@/components/button'
import Heading from '@/components/heading'

export default function AddMethodsError({
  handleRetry,
}: {
  handleRetry(): void
}) {
  const { t } = useTranslation()
  return (
    <div className={css.root}>
      <ExclamationCircleIcon className={css.icon} />
      <Heading className={css.heading} level={2}>
        {t('common:statuses.An Error has Occurred')}
      </Heading>
      <Button className={css.button} onClick={handleRetry} size="small">
        {t('common:actions.Try Again')}
      </Button>
    </div>
  )
}
