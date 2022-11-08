import { CheckCircleIcon } from '@heroicons/react/outline'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'

import css from './add-methods-success.module.css'

import Button from '@/components/button'
import { H2 } from '@/components/heading'
import { urls } from '@/utils/urls'

export default function AddMethodsSuccess() {
  const router = useRouter()
  const { t } = useTranslation()
  return (
    <div className={css.root}>
      <CheckCircleIcon className={css.icon} height="48" width="48" />
      <H2 size={1} bold mb={16}>
        {t('common:statuses.Success!')}
      </H2>
      <div className={css.successButtonWrapper}>
        <Button
          className={css.button}
          onClick={() => router.push(urls.myProfilePaymentMethods)}
        >
          {t('common:actions.View All Payment Methods')}
        </Button>
        <Button className={css.button} onClick={() => router.reload()}>
          {t('common:actions.Add New Payment Method')}
        </Button>
      </div>
    </div>
  )
}
