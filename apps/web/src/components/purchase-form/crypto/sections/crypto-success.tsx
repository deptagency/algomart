import { PackType, PublishedPack } from '@algomart/schemas'
import { CheckCircleIcon } from '@heroicons/react/outline'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback } from 'react'

import css from './crypto-success.module.css'

import Button from '@/components/button'
import Heading from '@/components/heading'
import { isAfterNow } from '@/utils/date-time'
import { urls } from '@/utils/urls'

interface CryptoSuccessProps {
  packId: string
  release?: PublishedPack
}

export default function CryptoSuccess({ packId, release }: CryptoSuccessProps) {
  const { push } = useRouter()
  const { t } = useTranslation()

  const isActiveAuction =
    release?.type === PackType.Auction &&
    isAfterNow(new Date(release?.auctionUntil as string))

  const handlePackOpening = useCallback(() => {
    const path = urls.packOpening.replace(':packId', packId)
    return push(path)
  }, [packId, push])

  return (
    <div className={css.successRoot}>
      <CheckCircleIcon className={css.icon} height="48" width="48" />
      {release?.type === PackType.Auction && (
        <>
          <Heading className={css.bidPlacedHeading} level={3}>
            {isActiveAuction
              ? t('common:statuses.Bid placed!')
              : t('common:statuses.Success!')}
          </Heading>
          {isActiveAuction && (
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
      <Button
        className={css.button}
        onClick={() =>
          !isActiveAuction
            ? handlePackOpening()
            : release?.slug
            ? push(urls.release.replace(':packSlug', release.slug))
            : push(urls.myCollectibles)
        }
      >
        {isActiveAuction
          ? t('common:actions.Back to Listing')
          : t('common:actions.Open Pack')}
      </Button>
    </div>
  )
}
