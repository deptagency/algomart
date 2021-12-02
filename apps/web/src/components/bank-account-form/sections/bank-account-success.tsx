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
  const { t } = useTranslation()
  const router = useRouter()
  const isActiveAuction =
    release.type === PackType.Auction &&
    isAfterNow(new Date(release.auctionUntil as string))

  const handleReturnToListing = useCallback(() => {
    const path = urls.release.replace(':packSlug', release.slug)
    router.push(path)
  }, [release.slug, router])

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
              <div className={css.bidPlacedNoticeText}>
                {t('forms:fields.bid.success', { title: release.title })}
                {' 🎉'}
              </div>
            )}
          </div>
        </>
      )}
      {release.type === PackType.Purchase && (
        <Heading className={css.successHeading} level={3}>
          {t('common:statuses.Success!')}
        </Heading>
      )}
      {bankAccountInstructions && (
        <div className={css.bankInstructions}>
          <Heading className={css.header} level={2}>
            {t('forms:fields.bankInstructions.label')}
          </Heading>
          <div className={css.instructions}>
            <Heading level={4}>
              {t('forms:fields.bankInstructions.trackingRef.label')}:
            </Heading>
            <p>{bankAccountInstructions.trackingRef}</p>
          </div>
          <Heading className={css.subHeader} level={3}>
            {t('forms:fields.bankInstructions.beneficiary.label')}
          </Heading>
          <div className={css.instructions}>
            <Heading level={4}>{t('forms:fields.fullName.label')}:</Heading>
            <p>{bankAccountInstructions.beneficiary.name}</p>
          </div>
          <div className={css.instructions}>
            <Heading level={4}>{t('forms:fields.address1.label')}:</Heading>
            <p>{bankAccountInstructions.beneficiary.address1}</p>
            <p>{bankAccountInstructions.beneficiary.address2}</p>
          </div>
          <Heading className={css.subHeader} level={3}>
            {t('forms:fields.bankInstructions.beneficiaryBank.label')}
          </Heading>
          <div className={css.instructions}>
            <Heading level={4}>
              {t('forms:fields.bankAddress.bankName.label')}:
            </Heading>
            <p>{bankAccountInstructions.beneficiaryBank.name}</p>
          </div>
          <div className={css.instructions}>
            <Heading level={4}>
              {t('forms:fields.bankInstructions.swiftCode.label')}:
            </Heading>
            <p>{bankAccountInstructions.beneficiaryBank.swiftCode}</p>
          </div>
          <div className={css.instructions}>
            <Heading level={4}>
              {t('forms:fields.routingNumber.label')}:
            </Heading>
            <p>{bankAccountInstructions.beneficiaryBank.routingNumber}</p>
          </div>
          <div className={css.instructions}>
            <Heading level={4}>
              {t('forms:fields.accountNumber.label')}:
            </Heading>
            <p>{bankAccountInstructions.beneficiaryBank.accountNumber}</p>
          </div>
          <div className={css.instructions}>
            <Heading level={4}>{t('forms:fields.address1.label')}:</Heading>
            <p>{bankAccountInstructions.beneficiaryBank.address}</p>
          </div>
          <div className={css.instructions}>
            <Heading level={4}>{t('forms:fields.city.label')}:</Heading>
            <p>{bankAccountInstructions.beneficiaryBank.city}</p>
          </div>
          <div className={css.instructions}>
            <Heading level={4}>{t('forms:fields.zipCode.label')}:</Heading>
            <p>{bankAccountInstructions.beneficiaryBank.postalCode}</p>
          </div>
          <div className={css.instructions}>
            <Heading level={4}>{t('forms:fields.country.label')}:</Heading>
            <p>{bankAccountInstructions.beneficiaryBank.country}</p>
          </div>
        </div>
      )}
      <Button className={css.button} onClick={handleReturnToListing}>
        {t('common:actions.Back to Listing')}
      </Button>
    </div>
  )
}
