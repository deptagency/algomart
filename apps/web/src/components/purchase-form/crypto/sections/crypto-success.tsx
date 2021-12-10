import { PackType, PublishedPack } from '@algomart/schemas'
import { CheckCircleIcon } from '@heroicons/react/outline'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'

import css from './crypto-success.module.css'

import Button from '@/components/button'
import Heading from '@/components/heading'
import { isAfterNow } from '@/utils/date-time'
import { urls } from '@/utils/urls'

interface CryptoSuccessProps {
  release?: PublishedPack
}

export default function CryptoSuccess({ release }: CryptoSuccessProps) {
  const { push } = useRouter()
  const { t } = useTranslation()

  const isActiveAuction =
    release?.type === PackType.Auction &&
    isAfterNow(new Date(release?.auctionUntil as string))

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
          <div className={css.bidPlacedNotice}>
            {isActiveAuction && (
              <p className={css.bidPlacedNoticeText}>
                {t('forms:fields.bid.success', { title: release.title })}
              </p>
            )}
          </div>
        </>
      )}
      {release?.type === PackType.Purchase && (
        <Heading className={css.successHeading} level={3}>
          {t('common:statuses.Success!')}
        </Heading>
      )}
      {release?.slug && (
        <Button
          className={css.button}
          onClick={() =>
            push(
              isActiveAuction
                ? urls.release.replace(':packSlug', release.slug)
                : urls.myCollectibles
            )
          }
        >
          {isActiveAuction
            ? t('common:actions.Back to Listing')
            : t('common:actions.View My Collection')}
        </Button>
      )}
    </div>
  )
}
