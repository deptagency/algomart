import { PackType } from '@algomart/schemas'
import { CheckCircleIcon } from '@heroicons/react/outline'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback } from 'react'

import css from './crypto-success.module.css'

import Button from '@/components/button'
import Heading from '@/components/heading'
import { usePaymentContext } from '@/contexts/payment-context'
import { urlFor, urls } from '@/utils/urls'

export default function CryptoSuccess() {
  const { push } = useRouter()
  const { t } = useTranslation()
  const { packId, release, isAuctionActive } = usePaymentContext()
  const packSlug = release?.slug

  const handlePackOpening = useCallback(() => {
    push(urlFor(urls.packOpening, { packId }))
  }, [packId, push])

  const handleContinue = () => {
    if (!isAuctionActive()) {
      handlePackOpening()
    } else {
      push(packSlug ? urlFor(urls.products, { packSlug }) : urls.myCollectibles)
    }
  }

  return (
    <div className={css.successRoot}>
      <CheckCircleIcon className={css.icon} height="48" width="48" />
      {release?.type === PackType.Auction && (
        <>
          <Heading className={css.bidPlacedHeading} level={3}>
            {isAuctionActive()
              ? t('common:statuses.Bid placed!')
              : t('common:statuses.Success!')}
          </Heading>
          {isAuctionActive() && (
            <div className={css.bidPlacedNotice}>
              <p className={css.bidPlacedNoticeText}>
                {t('forms:fields.bid.success', { title: release.title })}
              </p>
            </div>
          )}
        </>
      )}
      {release?.type === PackType.Purchase && (
        <Heading className={css.successHeading} level={3}>
          {t('common:statuses.Success!')}
        </Heading>
      )}
      <Button className={css.button} onClick={handleContinue}>
        {isAuctionActive()
          ? t('common:actions.Back to Listing')
          : t('common:actions.Open Pack')}
      </Button>
    </div>
  )
}
