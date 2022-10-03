import { CheckCircleIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'

import css from './transfer-status.module.css'

import Button from '@/components/button'
import { H2 } from '@/components/heading'
import { urls } from '@/utils/urls'

export default function Success() {
  const { push } = useRouter()
  const { t } = useTranslation()
  return (
    <div className={css.successRoot}>
      <H2>{t('common:statuses.Purchased!')}</H2>
      <CheckCircleIcon
        className={clsx(css.icon, css.successIcon)}
        height="150"
        width="150"
      />

      <Button
        data-e2e="credits-success-action"
        fullWidth
        onClick={() => push(urls.myWallet)}
        size="large"
      >
        {t('common:actions.Back To My Wallet')}
      </Button>
    </div>
  )
}
