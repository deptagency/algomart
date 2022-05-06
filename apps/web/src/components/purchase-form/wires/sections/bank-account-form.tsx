import { PackType } from '@algomart/schemas'
import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'

import css from './bank-account-form.module.css'

import AlertMessage from '@/components/alert-message/alert-message'
import Button from '@/components/button'
import Heading from '@/components/heading'
import Bid from '@/components/purchase-form/shared/bid'
import BillingAddress from '@/components/purchase-form/shared/billing-address'
import FullName from '@/components/purchase-form/shared/full-name'
import Select from '@/components/select/select'
import TextInput from '@/components/text-input/text-input'
import { useCurrency } from '@/contexts/currency-context'
import { useI18n } from '@/contexts/i18n-context'
import { usePaymentContext } from '@/contexts/payment-context'
import { useLocale } from '@/hooks/use-locale'
import { formatCurrency, formatIntToFixed } from '@/utils/currency'

export interface BankAccountFormProps {
  className?: string
  handleContinue: () => void
}

export default function BankAccountForm({
  className,
  handleContinue,
}: BankAccountFormProps) {
  const { bid, countries, getError, isAuctionActive, release } =
    usePaymentContext()
  const locale = useLocale()
  const { currency } = useCurrency()
  const { conversionRate } = useI18n()
  const { t } = useTranslation()
  const price =
    release?.type === PackType.Auction
      ? bid
      : formatIntToFixed(release?.price || 0, currency)

  return (
    <div className={className}>
      {getError('bid') ? (
        <AlertMessage
          className={css.notification}
          content={getError('bid')}
          variant="red"
        />
      ) : null}

      <div className={clsx(css.formSection)}>
        {isAuctionActive() ? (
          <Bid className={css.bid} />
        ) : (
          <>
            <Heading level={2}>{t('forms:sections.Bank Account')}</Heading>

            <TextInput
              error={getError('accountNumber')}
              label={t('forms:fields.accountNumber.label')}
              name="accountNumber"
              variant="small"
            />

            <TextInput
              error={getError('routingNumber')}
              label={t('forms:fields.routingNumber.label')}
              name="routingNumber"
              variant="small"
            />

            <FullName formErrors={{ fullName: getError('fullName') }} />

            <BillingAddress />

            <Heading level={2}>{t('forms:sections.Bank Address')}</Heading>

            <TextInput
              error={getError('bankName')}
              label={t('forms:fields.bankAddress.bankName.label')}
              name="bankName"
              variant="small"
            />
            <TextInput
              error={getError('bankAddress1')}
              label={t('forms:fields.bankAddress.bankAddress1.label')}
              name="bankAddress1"
              variant="small"
            />
            <TextInput
              error={getError('bankAddress2')}
              label={t('forms:fields.bankAddress.bankAddress2.label')}
              name="bankAddress2"
              variant="small"
            />
            <div className={css.formMultiRow}>
              <TextInput
                error={getError('bankCity')}
                label={t('forms:fields.city.label')}
                name="bankCity"
                variant="small"
              />
              <TextInput
                error={getError('bankDistrict')}
                label={t('forms:fields.state.label')}
                name="bankDistrict"
                variant="small"
              />
            </div>
            {countries.length > 0 && (
              <Select
                error={getError('bankCountry')}
                label={t('forms:fields.country.label')}
                id="bankCountry"
                name="bankCountry"
                options={countries}
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
      <Button disabled={!release} fullWidth onClick={handleContinue}>
        {t('common:actions.Continue to Summary')}
      </Button>
    </div>
  )
}
