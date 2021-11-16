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
                {t('forms:fields.bid.success', { title: release.title })}
                {' 🎉'}
              </p>
            )}
          </div>
          {bankAccountInstructions && !isActiveAuction && (
            <div className={css.bankInstructions}>
              <Heading className={css.header} level={2}>
                {t('forms:fields.bankInstructions.label')}
              </Heading>
              <p className={css.instructions}>
                <Heading level={4}>
                  {t('forms:fields.bankInstructions.trackingRef.label')}:
                </Heading>
                <span>{bankAccountInstructions.trackingRef}</span>
              </p>
              <Heading className={css.subHeader} level={3}>
                {t('forms:fields.bankInstructions.beneficiary.label')}
              </Heading>
              <p className={css.instructions}>
                <Heading level={4}>{t('forms:fields.fullName.label')}:</Heading>
                <span>{bankAccountInstructions.beneficiary.name}</span>
              </p>
              <p className={css.instructions}>
                <Heading level={4}>{t('forms:fields.address1.label')}:</Heading>
                <span>{bankAccountInstructions.beneficiary.address1}</span>
                <span>{bankAccountInstructions.beneficiary.address2}</span>
              </p>
              <Heading className={css.subHeader} level={3}>
                {t('forms:fields.bankInstructions.beneficiaryBank.label')}
              </Heading>
              <p className={css.instructions}>
                <Heading level={4}>
                  {t('forms:fields.bankAddress.bankName.label')}:
                </Heading>
                <span>{bankAccountInstructions.beneficiaryBank.name}</span>
              </p>
              <p className={css.instructions}>
                <Heading level={4}>
                  {t('forms:fields.bankInstructions.swiftCode.label')}:
                </Heading>
                <span>{bankAccountInstructions.beneficiaryBank.swiftCode}</span>
              </p>
              <p className={css.instructions}>
                <Heading level={4}>
                  {t('forms:fields.routingNumber.label')}:
                </Heading>
                <span>
                  {bankAccountInstructions.beneficiaryBank.routingNumber}
                </span>
              </p>
              <p className={css.instructions}>
                <Heading level={4}>
                  {t('forms:fields.accountNumber.label')}:
                </Heading>
                <span>
                  {bankAccountInstructions.beneficiaryBank.accountNumber}
                </span>
              </p>
              <p className={css.instructions}>
                <Heading level={4}>{t('forms:fields.address1.label')}:</Heading>
                <span>{bankAccountInstructions.beneficiaryBank.address}</span>
              </p>
              <p className={css.instructions}>
                <Heading level={4}>{t('forms:fields.city.label')}:</Heading>
                <span>{bankAccountInstructions.beneficiaryBank.city}</span>
              </p>
              <p className={css.instructions}>
                <Heading level={4}>{t('forms:fields.zipCode.label')}:</Heading>
                <span>
                  {bankAccountInstructions.beneficiaryBank.postalCode}
                </span>
              </p>
              <p className={css.instructions}>
                <Heading level={4}>{t('forms:fields.country.label')}:</Heading>
                <span>{bankAccountInstructions.beneficiaryBank.country}</span>
              </p>
            </div>
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
