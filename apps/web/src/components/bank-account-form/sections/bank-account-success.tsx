import {
  GetPaymentBankAccountInstructions,
  PackType,
  PublishedPack,
} from '@algomart/schemas'
import { CheckCircleIcon } from '@heroicons/react/outline'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback } from 'react'

import css from './bank-account-success.module.css'

import Button from '@/components/button'
import Heading from '@/components/heading'
import { isAfterNow } from '@/utils/date-time'
import { urls } from '@/utils/urls'

interface BankAccountSuccessProps {
  bankAccountInstructions: GetPaymentBankAccountInstructions | null
  release: PublishedPack
}

export default function BankAccountSuccess({
  bankAccountInstructions,
  release,
}: BankAccountSuccessProps) {
  const { push } = useRouter()
  const { t } = useTranslation()

  const isActiveAuction =
    release.type === PackType.Auction &&
    isAfterNow(new Date(release.auctionUntil as string))

  const handleReturnToListing = useCallback(() => {
    const path = urls.release.replace(':packSlug', release.slug)
    if (typeof window !== 'undefined') {
      window.location.assign(new URL(path, window.location.origin).href)
    }
  }, [release.slug])

  return (
    <div className={css.root}>
      <CheckCircleIcon className={css.icon} height="48" width="48" />
      {release.type === PackType.Auction && (
        <>
          <Heading className={css.bidPlacedHeading} level={3}>
            {isActiveAuction
              ? t('common:statuses.Bid placed!')
              : t('common:statuses.Success!')}
          </Heading>
          <div className={css.bidPlacedNotice}>
            {isActiveAuction && (
              <p className={css.bidPlacedNoticeText}>
                {t('forms:fields.bid.success')}
                {'🎉'}
              </p>
            )}
          </div>
          {bankAccountInstructions && (
            <>
              <p>{bankAccountInstructions.trackingRef}</p>
              <p>{bankAccountInstructions.beneficiary.name}</p>
              <p>{bankAccountInstructions.beneficiary.address1}</p>
              <p>{bankAccountInstructions.beneficiary.address2}</p>
              <p>{bankAccountInstructions.beneficiaryBank.name}</p>
              <p>{bankAccountInstructions.beneficiaryBank.swiftCode}</p>
              <p>{bankAccountInstructions.beneficiaryBank.routingNumber}</p>
              <p>{bankAccountInstructions.beneficiaryBank.accountNumber}</p>
              <p>{bankAccountInstructions.beneficiaryBank.address}</p>
              <p>{bankAccountInstructions.beneficiaryBank.city}</p>
              <p>{bankAccountInstructions.beneficiaryBank.postalCode}</p>
              <p>{bankAccountInstructions.beneficiaryBank.country}</p>
              <p>{bankAccountInstructions.status}</p>
            </>
          )}
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
            {t('common:actions.Back to Listing')}
          </Button>
        </>
      )}
      {release.type === PackType.Purchase && (
        <>
          <Heading className={css.successHeading} level={3}>
            {t('common:statuses.Success!')}
          </Heading>
          <Button className={css.button} onClick={handleReturnToListing}>
            {t('common:actions.Back to Listing')}
          </Button>
        </>
      )}
    </div>
  )
}
