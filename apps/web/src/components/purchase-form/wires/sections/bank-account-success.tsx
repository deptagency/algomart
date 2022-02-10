import {
  PackType,
  PaymentBankAccountInstructions,
  PublishedPack,
} from '@algomart/schemas'
import { CheckCircleIcon } from '@heroicons/react/outline'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback } from 'react'

import css from './bank-account-success.module.css'

import Button from '@/components/button'
import Heading from '@/components/heading'
import { useCurrency } from '@/hooks/use-currency'
import { isAfterNow } from '@/utils/date-time'
import { formatCurrency, formatIntToFloat } from '@/utils/format-currency'
import { urls } from '@/utils/urls'

interface BankAccountSuccessProps {
  bankAccountInstructions: PaymentBankAccountInstructions | null
  release?: PublishedPack
}

export default function BankAccountSuccess({
  bankAccountInstructions,
  release,
}: BankAccountSuccessProps) {
  const { t, lang } = useTranslation()
  const currency = useCurrency()
  const router = useRouter()
  const price = bankAccountInstructions?.amount
    ? formatIntToFloat(bankAccountInstructions.amount, currency)
    : '0'
  const isActiveAuction =
    release?.type === PackType.Auction &&
    isAfterNow(new Date(release?.auctionUntil as string))

  const handleReturnToListing = useCallback(() => {
    if (release?.slug) {
      router.push(urls.release.replace(':packSlug', release.slug))
    } else router.push(urls.releases)
  }, [release?.slug, router])

  return (
    <div className={css.root}>
      {release?.type === PackType.Auction && isActiveAuction && (
        <>
          <CheckCircleIcon className={css.icon} height="48" width="48" />
          <Heading className={css.bidPlacedHeading} level={3}>
            {t('common:statuses.Bid placed!')}
          </Heading>
          <div className={css.bidPlacedNotice}>
            <div className={css.bidPlacedNoticeText}>
              {t('forms:fields.bid.success', { title: release.title })}
              {' 🎉'}
            </div>
          </div>
        </>
      )}
      {bankAccountInstructions && (
        <div className={css.bankInstructions}>
          <Heading className={css.header} level={2}>
            {t('forms:fields.bankInstructions.label')}
          </Heading>
          <p className={css.bankInstructionsHelpText}>
            {t('forms:fields.bankInstructions.helpText')}
          </p>
          <hr className={css.separator} />
          <div className={css.instructions}>
            <Heading level={4}>
              {t('forms:fields.bankInstructions.trackingRef.label')}
            </Heading>
            <p>{bankAccountInstructions.trackingRef}</p>
          </div>
          <Heading className={css.subHeader} level={3}>
            {t('forms:fields.bankInstructions.beneficiary.label')}
          </Heading>
          <div className={css.instructions}>
            <Heading level={4}>{t('forms:fields.fullName.label')}</Heading>
            <p>{bankAccountInstructions.beneficiary.name}</p>
          </div>
          <div className={css.instructions}>
            <Heading level={4}>{t('forms:fields.address1.label')}</Heading>
            <p>
              {bankAccountInstructions.beneficiary.address1}{' '}
              {bankAccountInstructions.beneficiary.address2}
            </p>
          </div>
          <Heading className={css.subHeader} level={3}>
            {t('forms:fields.bankInstructions.beneficiaryBank.label')}
          </Heading>
          <div className={css.instructions}>
            <Heading level={4}>
              {t('forms:fields.bankAddress.bankName.label')}
            </Heading>
            <p>{bankAccountInstructions.beneficiaryBank.name}</p>
          </div>
          <div className={css.instructions}>
            <Heading level={4}>
              {t('forms:fields.bankInstructions.swiftCode.label')}
            </Heading>
            <p>{bankAccountInstructions.beneficiaryBank.swiftCode}</p>
          </div>
          <div className={css.instructions}>
            <Heading level={4}>{t('forms:fields.routingNumber.label')}</Heading>
            <p>{bankAccountInstructions.beneficiaryBank.routingNumber}</p>
          </div>
          <div className={css.instructions}>
            <Heading level={4}>{t('forms:fields.accountNumber.label')}</Heading>
            <p>{bankAccountInstructions.beneficiaryBank.accountNumber}</p>
          </div>
          <div className={css.instructions}>
            <Heading level={4}>{t('forms:fields.address1.label')}</Heading>
            <p>{bankAccountInstructions.beneficiaryBank.address}</p>
          </div>
          <div className={css.instructions}>
            <Heading level={4}>{t('forms:fields.city.label')}</Heading>
            <p>{bankAccountInstructions.beneficiaryBank.city}</p>
          </div>
          <div className={css.instructions}>
            <Heading level={4}>{t('forms:fields.zipCode.label')}</Heading>
            <p>{bankAccountInstructions.beneficiaryBank.postalCode}</p>
          </div>
          <div className={css.instructions}>
            <Heading level={4}>{t('forms:fields.country.label')}</Heading>
            <p>{bankAccountInstructions.beneficiaryBank.country}</p>
          </div>
        </div>
      )}
      {/* Price */}
      {(release?.type === PackType.Auction && isActiveAuction) ||
        (release?.type === PackType.Purchase && (
          <div className={css.priceContainer}>
            <p className={css.priceLabel}>{t('release:Total')}</p>
            <p className={css.priceValue}>
              {formatCurrency(price, lang, currency)}
            </p>
          </div>
        ))}
      <Button className={css.button} onClick={handleReturnToListing}>
        {t('common:actions.Back to Listing')}
      </Button>
    </div>
  )
}
