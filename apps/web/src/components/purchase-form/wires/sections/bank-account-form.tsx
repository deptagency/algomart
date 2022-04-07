import { PackType, PublishedPack } from '@algomart/schemas'
import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'

import css from './bank-account-form.module.css'

import AlertMessage from '@/components/alert-message/alert-message'
import Button from '@/components/button'
import Heading from '@/components/heading'
import Bid from '@/components/purchase-form/shared/bid'
import BillingAddress from '@/components/purchase-form/shared/billing-address'
import FullName from '@/components/purchase-form/shared/full-name'
import Select, { SelectOption } from '@/components/select-input/select-input'
import TextInput from '@/components/text-input/text-input'
import { useI18n } from '@/contexts/i18n-context'
import { FormValidation,getError } from '@/contexts/payment-context'
import { useCurrency } from '@/hooks/use-currency'
import { useLocale } from '@/hooks/use-locale'
import { isAfterNow } from '@/utils/date-time'
import { formatCurrency, formatIntToFloat } from '@/utils/format-currency'

export interface BankAccountFormProps {
  bid: string | null
  className?: string
  countries: SelectOption[]
  formErrors?: FormValidation
  handleContinue: () => void
  initialBid?: string
  release?: PublishedPack
  setBid: (bid: string | null) => void
}

export default function BankAccountForm({
  bid,
  className,
  countries: countryOptions,
  formErrors,
  handleContinue,
  initialBid,
  release,
  setBid,
}: BankAccountFormProps) {
  const locale = useLocale()
  const currency = useCurrency()
  const { conversionRate } = useI18n()
  const { t } = useTranslation()
  const isAuctionActive =
    release?.type === PackType.Auction &&
    isAfterNow(new Date(release.auctionUntil as string))
  const price =
    release?.type === PackType.Auction
      ? bid
      : formatIntToFloat(release?.price || 0, currency)

  return (
    <div className={className}>
      {getError('bid', formErrors) ? (
        <AlertMessage
          className={css.notification}
          content={getError('bid', formErrors)}
          variant="red"
        />
      ) : null}

      <div className={clsx(css.formSection)}>
        {isAuctionActive ? (
          <Bid
            bid={bid}
            className={css.bid}
            initialBid={initialBid}
            setBid={setBid}
          />
        ) : (
          <>
            <Heading level={2}>{t('forms:sections.Bank Account')}</Heading>

            <TextInput
              error={getError('accountNumber', formErrors)}
              label={t('forms:fields.accountNumber.label')}
              name="accountNumber"
              variant="small"
            />

            <TextInput
              error={getError('routingNumber', formErrors)}
              label={t('forms:fields.routingNumber.label')}
              name="routingNumber"
              variant="small"
            />

            <FullName
              formErrors={{ fullName: getError('fullName', formErrors) }}
            />

            <BillingAddress
              countries={countryOptions}
              formErrors={{
                address1: getError('address1', formErrors),
                city: getError('city', formErrors),
                state: getError('state', formErrors),
                country: getError('country', formErrors),
                zipCode: getError('zipCode', formErrors),
              }}
            />

            <Heading level={2}>{t('forms:sections.Bank Address')}</Heading>

            <TextInput
              error={getError('bankName', formErrors)}
              label={t('forms:fields.bankAddress.bankName.label')}
              name="bankName"
              variant="small"
            />
            <TextInput
              error={getError('bankAddress1', formErrors)}
              label={t('forms:fields.bankAddress.bankAddress1.label')}
              name="bankAddress1"
              variant="small"
            />
            <TextInput
              error={getError('bankAddress2', formErrors)}
              label={t('forms:fields.bankAddress.bankAddress2.label')}
              name="bankAddress2"
              variant="small"
            />
            <div className={css.formMultiRow}>
              <TextInput
                error={getError('bankCity', formErrors)}
                label={t('forms:fields.city.label')}
                name="bankCity"
                variant="small"
              />
              <TextInput
                error={getError('bankDistrict', formErrors)}
                label={t('forms:fields.state.label')}
                name="bankDistrict"
                variant="small"
              />
            </div>
            {countryOptions.length > 0 && (
              <Select
                error={getError('bankCountry', formErrors)}
                label={t('forms:fields.country.label')}
                id="bankCountry"
                name="bankCountry"
                options={countryOptions}
                placeholder="US"
              />
            )}
          </>
        )}
      </div>

      {/* Price */}
      <div className={css.priceContainer}>
        <p className={css.priceLabel}>{t('release:Total')}</p>
        <p className={css.priceValue}>
          {formatCurrency(price, locale, currency, conversionRate)}
        </p>
      </div>

      {/* Submit */}
      <Button
        disabled={!release}
        fullWidth
        type="button"
        onClick={handleContinue}
      >
        {t('common:actions.Continue to Summary')}
      </Button>
    </div>
  )
}
