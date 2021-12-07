import { DEFAULT_CURRENCY, PackType, PublishedPack } from '@algomart/schemas'
import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'
import { useState } from 'react'

import css from './bank-account-form.module.css'

import AlertMessage from '@/components/alert-message/alert-message'
import Button from '@/components/button'
import CurrencyInput from '@/components/currency-input/currency-input'
import Heading from '@/components/heading'
import BillingAddress from '@/components/purchase-form/sections/billing-address'
import FullName from '@/components/purchase-form/sections/full-name'
import Select from '@/components/select/select'
import TextInput from '@/components/text-input/text-input'
import { FormValidation } from '@/contexts/payment-context'
import { useLocale } from '@/hooks/use-locale'
import { isAfterNow } from '@/utils/date-time'
import { formatCurrency, formatIntToFloat } from '@/utils/format-currency'

export interface BankAccountFormProps {
  formErrors?: FormValidation
  currentBid: number | null
  price: string | null
  release: PublishedPack
}

export default function BankAccountForm({
  formErrors,
  currentBid,
  price,
  release,
}: BankAccountFormProps) {
  const locale = useLocale()
  const { t, lang } = useTranslation()

  const initialBid = currentBid ? formatIntToFloat(currentBid) : '0'

  const [bid, setBid] = useState<string | null>(initialBid)
  const isAuctionActive =
    release.type === PackType.Auction &&
    isAfterNow(new Date(release.auctionUntil as string))
  const countryOptions = [
    { id: 'CA', label: t('forms:fields.country.values.CA') },
    { id: 'US', label: t('forms:fields.country.values.US') },
  ]

  return (
    <div className={css.form}>
      {formErrors && 'bid' in formErrors && (
        <AlertMessage
          className={css.notification}
          content={formErrors.bid}
          variant="red"
        />
      )}

      <div className={clsx(css.formSection)}>
        {isAuctionActive ? (
          <>
            <CurrencyInput
              className={css.bid}
              decimalsLimit={2}
              handleChange={(value) => setBid(value)}
              helpText={
                currentBid
                  ? t('forms:fields.bid.helpTextCurrentBid', {
                      amount: formatCurrency(initialBid, lang),
                    })
                  : undefined
              }
              id="bid-input"
              intlConfig={{ locale, currency: DEFAULT_CURRENCY }}
              label={t('forms:fields.bid.label')}
              name="bid-input"
              value={bid || ''}
              variant={'small'}
            />
            {/* Force formData to be built from this "unmasked" value */}
            <input id="bid" name="bid" type="hidden" value={bid as string} />
          </>
        ) : (
          <>
            <Heading level={2}>{t('forms:sections.Bank Account')}</Heading>

            <TextInput
              error={
                formErrors && 'accountNumber' in formErrors
                  ? (formErrors.accountNumber as string)
                  : ''
              }
              label={t('forms:fields.accountNumber.label')}
              name="accountNumber"
              variant="small"
            />

            <TextInput
              error={
                formErrors && 'routingNumber' in formErrors
                  ? (formErrors.routingNumber as string)
                  : ''
              }
              label={t('forms:fields.routingNumber.label')}
              name="routingNumber"
              variant="small"
            />

            <FullName
              formErrors={{
                fullName:
                  formErrors && 'fullName' in formErrors
                    ? (formErrors.fullName as string)
                    : '',
              }}
            />

            <BillingAddress
              formErrors={{
                address1:
                  formErrors && 'address1' in formErrors
                    ? (formErrors.address1 as string)
                    : '',
                city:
                  formErrors && 'city' in formErrors
                    ? (formErrors.city as string)
                    : '',
                state:
                  formErrors && 'state' in formErrors
                    ? (formErrors.state as string)
                    : '',
                country:
                  formErrors && 'country' in formErrors
                    ? (formErrors.country as string)
                    : '',
                zipCode:
                  formErrors && 'zipCode' in formErrors
                    ? (formErrors.zipCode as string)
                    : '',
              }}
            />

            <Heading level={2}>{t('forms:sections.Bank Address')}</Heading>

            <TextInput
              error={
                formErrors && 'bankName' in formErrors
                  ? (formErrors.bankName as string)
                  : ''
              }
              label={t('forms:fields.bankAddress.bankName.label')}
              name="address1"
              variant="small"
            />
            <TextInput
              error={
                formErrors && 'bankAddress1' in formErrors
                  ? (formErrors.bankAddress1 as string)
                  : ''
              }
              label={t('forms:fields.bankAddress.bankAddress1.label')}
              name="bankAddress1"
              variant="small"
            />
            <TextInput
              error={
                formErrors && 'bankAddress2' in formErrors
                  ? (formErrors.bankAddress2 as string)
                  : ''
              }
              label={t('forms:fields.bankAddress.bankAddress2.label')}
              name="bankAddress2"
              variant="small"
            />
            <div className={css.formMultiRow}>
              <TextInput
                error={
                  formErrors && 'bankCity' in formErrors
                    ? (formErrors.bankCity as string)
                    : ''
                }
                label={t('forms:fields.city.label')}
                name="bankCity"
                variant="small"
              />
              <TextInput
                error={
                  formErrors && 'bankDistrict' in formErrors
                    ? (formErrors.bankDistrict as string)
                    : ''
                }
                label={t('forms:fields.state.label')}
                name="bankDistrict"
                variant="small"
              />
            </div>
            <Select
              defaultOption={countryOptions[1]}
              error={
                formErrors && 'bankCountry' in formErrors
                  ? (formErrors.bankCountry as string)
                  : ''
              }
              label={t('forms:fields.country.label')}
              id="bankCountry"
              name="bankCountry"
              options={countryOptions}
              placeholder="US"
            />
          </>
        )}
      </div>

      {/* Price */}
      <div className={css.priceContainer}>
        <p className={css.priceLabel}>{t('release:Total')}</p>
        <p className={css.priceValue}>{formatCurrency(price, lang)}</p>
      </div>

      {/* Submit */}
      <Button disabled={!release} fullWidth type="button">
        {isAuctionActive
          ? t('common:actions.Place Bid')
          : t('common:actions.Save Bank Information')}
      </Button>
    </div>
  )
}
