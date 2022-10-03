import {
  CollectibleListingStatus,
  CollectibleWithDetails,
} from '@algomart/schemas'
import { useRouter } from 'next/router'
import Trans from 'next-translate/Trans'
import useTranslation from 'next-translate/useTranslation'
import { ReactNode, useCallback, useEffect, useState } from 'react'

import css from './nft-list-for-sale-template.module.css'

import Button from '@/components/button'
import LinkButton from '@/components/link-button'
import ListCollectibleForm from '@/components/list-collectible-form/list-collectible-form'
import MarketplaceTransactionStatusDisplay, {
  MarketplaceTransactionType,
} from '@/components/list-collectible-form/sections/marketplace-transaction-status-display'
import Loading from '@/components/loading/loading'
import MainPanel from '@/components/main-panel/main-panel'
import MainPanelHeader from '@/components/main-panel-header'
import ProductSaleHeader from '@/components/product-sale-header/product-sale-header'
import { useAuth } from '@/contexts/auth-context'
import { useSecondaryMarketplaceFlag } from '@/hooks/use-secondary-marketplace-flag'
import { CollectibleService } from '@/services/collectible-service'
import { formatCurrency } from '@/utils/currency'
import getTransferrableStatus, {
  TransferrableStatus,
} from '@/utils/get-transferrable-status'
import { hashEvents, urlFor, urls } from '@/utils/urls'

export interface NFTListForSaleTemplateProps {
  collectible: CollectibleWithDetails
  currentOwnerHasShowcase?: boolean
}

const initialOperationState = {
  inProgress: false,
  successful: false,
  error: null,
}

export default function NFTListForSaleTemplate({
  collectible,
}: NFTListForSaleTemplateProps) {
  const { t } = useTranslation()
  const auth = useAuth()
  const { push } = useRouter()
  const userAddress = auth.user?.address

  const secondaryMarketplaceEnabled = useSecondaryMarketplaceFlag()

  const transferrableStatus = getTransferrableStatus(collectible, userAddress)
  const isTransferrable =
    transferrableStatus === TransferrableStatus.CanTransfer
  const isListed = collectible.listingStatus === CollectibleListingStatus.Active
  const isYours = collectible.currentOwnerAddress === userAddress
  const transferMessage = {
    isListed: t('nft:sell.isListed'),
    transactedRecently: t('nft:sell.transactedRecently', {
      date: new Date(collectible.transferrableAt).toLocaleString(),
    }),
    notOwner: t('nft:sell.notOwner'),
    noUser: t('nft:sell.noUser'),
  }[transferrableStatus]

  const [transactionType, setTransactionType] =
    useState<MarketplaceTransactionType | null>()
  const [transactionOperationState, setTransactionOperationState] = useState(
    initialOperationState
  )

  const handleListForSaleFormSubmit = useCallback(
    async ({ price }: { price: number }) => {
      setTransactionType(MarketplaceTransactionType.LIST)
      setTransactionOperationState((s) => ({
        ...s,
        inProgress: true,
      }))
      const ok = await CollectibleService.instance.listForSale(
        collectible.id,
        price
      )
      setTransactionOperationState((s) => ({
        ...s,
        inProgress: false,
        error: !ok,
        successful: ok,
      }))
      push(hashEvents.listingAdded, undefined, { scroll: false })
    },
    [collectible.id, push]
  )

  const handleDelist = useCallback(async () => {
    window.scrollTo(0, 0)
    setTransactionType(MarketplaceTransactionType.DELIST)
    setTransactionOperationState((s) => ({
      ...s,
      inProgress: true,
    }))
    const ok = await CollectibleService.instance.delist(collectible.listingId)
    setTransactionOperationState((s) => ({
      ...s,
      inProgress: false,
      error: !ok,
      successful: ok,
    }))
    push(hashEvents.listingRemoved, undefined, { scroll: false })
  }, [collectible.listingId, push])

  // when list for sale starts pending scroll page to top
  useEffect(() => {
    if (transactionOperationState.inProgress) {
      window.scrollTo({ top: 0 })
    }
  }, [transactionOperationState.inProgress])

  const resetOperationState = useCallback(() => {
    setTransactionOperationState(initialOperationState)
  }, [])

  let content: ReactNode
  if (auth.isAuthenticating) {
    content = <Loading className="m-16" />
  } else if (
    transactionType &&
    (transactionOperationState.inProgress ||
      transactionOperationState.error ||
      transactionOperationState.successful)
  ) {
    content = (
      <MarketplaceTransactionStatusDisplay
        marketplaceTransactionState={transactionOperationState}
        onBack={resetOperationState}
        transactionType={transactionType}
      />
    )
  } else if (
    (!isTransferrable && !isListed) ||
    (!isTransferrable && !isYours)
  ) {
    content = (
      <div className={css.contentPadding}>
        {transferMessage}
        <LinkButton
          href={urlFor(urls.nftDetails, { assetId: collectible.address })}
          fullWidth
        >
          {t('common:actions.Back To Collectible')}
        </LinkButton>
      </div>
    )
  } else if (secondaryMarketplaceEnabled) {
    content = isListed ? (
      <div className={css.contentPadding}>
        <Trans
          components={[<p key={0} />, <b key={1} />]}
          i18nKey="nft:sell.listed"
          values={{ price: formatCurrency(collectible.price) }}
        />
        <Button
          className="mt-8"
          fullWidth
          onClick={handleDelist}
          variant="primary"
          data-e2e="cancel-listing-button"
        >
          {t('nft:sell.removeListing')}
        </Button>
      </div>
    ) : (
      <div className={css.contentPadding}>
        <ListCollectibleForm
          collectible={collectible}
          onSubmit={handleListForSaleFormSubmit}
        />
      </div>
    )
  } else {
    content = (
      <div className={css.contentPadding}>
        <p>{t('nft:sell.body')}</p>
        {/* TODO: update href */}
        <LinkButton href="/" fullWidth disabled>
          {t(`nft:sell.listForSaleComingSoon`)}
        </LinkButton>
      </div>
    )
  }

  return (
    <div className={css.root}>
      <ProductSaleHeader
        imageSize={80}
        title={collectible.title}
        imageUrl={collectible.image}
      />
      <MainPanel>
        <MainPanelHeader
          title={isListed ? t('nft:sell.removeListing') : t('nft:sell.title')}
        />
        {content}
      </MainPanel>
    </div>
  )
}
