import { ExclamationCircleIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'

import css from './transfer-status.module.css'

import { H2 } from '@/components/heading'

export default function Failure({ payment }) {
  const { t } = useTranslation()
  return (
    <div className={css.failureRoot}>
      <H2>{t('common:statuses.An Error has Occurred')}</H2>
      <ExclamationCircleIcon
        className={clsx(css.icon, css.errorIcon)}
        height="150"
        width="150"
      />
      <p className={css.errorMessage}>{t('forms:errors.failedTransfer')}</p>
      {payment.error && <code className={css.errorBody}>{payment.error}</code>}
    </div>
  )
}
