import { CheckoutStatus } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'

import css from './purchase-product-status.module.css'

import Loading from '@/components/loading/loading'
import PurchaseWithCreditsError from '@/components/purchase-with-credits/purchase-with-credits-error'
import PurchaseWithCreditsSuccess from '@/components/purchase-with-credits/purchase-with-credits-success'

export interface PurchaseProductStatusProps {
  loadingText: string
  status: string
  handleRetry: () => void
  handleSuccessAction: () => void
  successActionLabel: string
}

export default function PurchaseProductStatus({
  loadingText,
  status,
  handleRetry,
  handleSuccessAction,
  successActionLabel,
}: PurchaseProductStatusProps) {
  const { t } = useTranslation()

  return (
    <section className={css.root}>
      <div className={css.status}>
        {loadingText && <Loading loadingText={loadingText} />}

        {status === CheckoutStatus.success && (
          <PurchaseWithCreditsSuccess
            actionLabel={successActionLabel || t('common:actions.Open Pack')}
            handleSuccessAction={handleSuccessAction}
          />
        )}

        {status === CheckoutStatus.error && (
          <PurchaseWithCreditsError
            errorLabel={t('release:failedToPurchase')}
            handleRetry={handleRetry}
          />
        )}
      </div>
    </section>
  )
}
