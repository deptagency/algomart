import { CollectibleMarketplaceTransactionState } from '@algomart/schemas'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/outline'
import useTranslation from 'next-translate/useTranslation'

import css from './marketplace-transaction-status-display.module.css'

import Button from '@/components/button'
import { H2 } from '@/components/heading'
import LinkButton from '@/components/link-button'
import Loading from '@/components/loading/loading'
import { urls } from '@/utils/urls'

export enum MarketplaceTransactionType {
  LIST = 'list',
  DELIST = 'delist',
}

export interface MarketplaceTransactionStatusDisplayProps {
  marketplaceTransactionState: CollectibleMarketplaceTransactionState
  onBack: () => void
  transactionType: MarketplaceTransactionType
}

export default function MarketplaceTransactionStatusDisplay({
  marketplaceTransactionState,
  onBack,
  transactionType,
}: MarketplaceTransactionStatusDisplayProps) {
  const { t } = useTranslation()

  return (
    <div className={css.marketplaceTransactionStatusDisplay}>
      {marketplaceTransactionState.inProgress && <Loading />}
      {marketplaceTransactionState.successful && (
        <>
          <H2 mb={6}>
            {transactionType === MarketplaceTransactionType.LIST
              ? t('nft:listForSaleStatus.success')
              : t('nft:delistStatus.success')}
          </H2>
          <CheckCircleIcon strokeWidth={1} className={css.success} />
          <LinkButton
            className="mt-16"
            href={urls.myCollectibles}
            variant="primary"
            data-e2e="back-to-collection"
          >
            {t('common:actions.Back To My Collection')}
          </LinkButton>
        </>
      )}
      {marketplaceTransactionState.error && (
        <>
          <span className={css.error}>
            <ExclamationCircleIcon strokeWidth={1} />
          </span>
          <H2>{t('common:statuses.An Error has Occurred')}</H2>
          <Button size="large" onClick={onBack}>
            {t('common:actions.Go Back')}
          </Button>
        </>
      )}
    </div>
  )
}
