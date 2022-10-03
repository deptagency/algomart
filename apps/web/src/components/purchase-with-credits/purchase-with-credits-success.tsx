import { CheckCircleIcon } from '@heroicons/react/outline'
import useTranslation from 'next-translate/useTranslation'

import css from './purchase-with-credits-success.module.css'

import Button from '@/components/button'
import { H2 } from '@/components/heading'
export interface PurchaseWithCreditsSuccessProps {
  actionLabel: string
  handleSuccessAction: () => void
}

export default function PurchaseWithCreditsSuccess({
  actionLabel,
  handleSuccessAction,
}: PurchaseWithCreditsSuccessProps) {
  const { t } = useTranslation()

  return (
    <div className={css.successRoot}>
      <H2 mb={16} mt={12}>
        {t('common:statuses.Success!')}
      </H2>

      <CheckCircleIcon className={css.icon} strokeWidth={1} />

      <Button
        data-e2e="credits-success-action"
        className={css.button}
        size="large"
        fullWidth
        onClick={handleSuccessAction}
      >
        {actionLabel}
      </Button>
    </div>
  )
}
