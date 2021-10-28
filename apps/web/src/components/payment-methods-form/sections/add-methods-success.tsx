import { CheckCircleIcon } from '@heroicons/react/outline'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'

import css from './add-methods-success.module.css'

import Button from '@/components/button'
import Heading from '@/components/heading'
import { urls } from '@/utils/urls'

export default function AddMethodsSuccess() {
  const router = useRouter()
  const { t } = useTranslation()
  return (
    <div className={css.root}>
      <CheckCircleIcon className={css.icon} height="48" width="48" />
      <Heading className={css.heading} level={2}>
        {t('common:statuses.Success!')}
      </Heading>
      <div className={css.successButtonWrapper}>
        <Button
          className={css.button}
          onClick={() => router.push(urls.myProfilePaymentMethods)}
          size="small"
        >
          {t('common:actions.View All Payment Methods')}
        </Button>
        <Button
          className={css.button}
          onClick={() => router.reload()}
          size="small"
        >
          {t('common:actions.Add New Payment Method')}
        </Button>
      </div>
    </div>
  )
}
