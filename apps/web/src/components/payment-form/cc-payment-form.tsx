import { PaymentOption } from '@algomart/schemas'
import Trans from 'next-translate/Trans'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent } from 'react'

import css from './cc-payment-form.module.css'

import AlertMessage from '@/components/alert-message/alert-message'
import AppLink from '@/components/app-link/app-link'
import Async from '@/components/async/async'
import Button from '@/components/button'
import CurrencyInput from '@/components/currency-input/currency-input'
import { FilterableSelectOption } from '@/components/filterable-select'
import KYCNotice from '@/components/kyc/notice'
import CcFields from '@/components/payment-form/cc-fields'
import CcPaymentSummary from '@/components/payment-form/cc-payment-summary'
import EmailVerificationPrompt from '@/components/profile/email-verification-prompt'
import RadioGroupField from '@/components/radio-group-field'
import { useAuth } from '@/contexts/auth-context'
import {
  FormValidation,
  PurchaseStep,
} from '@/contexts/purchase-credits-context'
import { validateCreditsPurchaseAmount } from '@/utils/purchase-validation'
import { urls } from '@/utils/urls'

export interface CcPaymentFormProps {
  amount: number
  countries: FilterableSelectOption[]
  formErrors?: FormValidation
  getError: (field: string) => string
  isCombinedPurchase: boolean
  isVerificationEnabled: boolean
  isVerificationNeeded: boolean
  handleSelectedCountryChange: (countryCode: string) => void
  handleSubmitPayment(event: FormEvent<HTMLFormElement>): void
  loadingText: string
  paymentOption: PaymentOption
  selectedCountry: FilterableSelectOption
  setAmount?(amount: number): void
  setPaymentOption: (paymentOption: PaymentOption) => void
  setStep: (step: PurchaseStep) => void
  setFormErrors(errors: FormValidation): void
}

export default function CcPaymentForm({
  amount,
  countries,
  formErrors,
  getError,
  isCombinedPurchase,
  isVerificationEnabled,
  isVerificationNeeded,
  handleSelectedCountryChange,
  handleSubmitPayment,
  loadingText,
  paymentOption,
  selectedCountry,
  setAmount,
  setPaymentOption,
  setStep,
  setFormErrors,
}: CcPaymentFormProps) {
  const { t } = useTranslation()
  const { user } = useAuth()

  const paymentOptions = [
    {
      label: t('forms:purchaseCredits.Visa / Mastercard'),
      value: PaymentOption.Card,
    },
    {
      label: 'USDC-A',
      value: PaymentOption.USDC,
    },
  ]

  if (!user?.emailVerified) {
    return <EmailVerificationPrompt inline />
  }

  const handleCryptoNext = async () => {
    const validation = await validateCreditsPurchaseAmount(t)({ amount })
    if (validation.state === 'invalid') {
      setFormErrors(validation.errors)
      return
    }
    setStep(PurchaseStep.walletConnect)
  }

  return (
    <Async isLoading={!!loadingText} loadingText={loadingText}>
      <div className={css.content}>
        <RadioGroupField
          name="paymentOption"
          label={t('forms:purchaseCredits.Purchase with')}
          value={paymentOption}
          options={paymentOptions}
          onChange={setPaymentOption}
        />
        {!isCombinedPurchase && (
          <div className={css.amount}>
            <CurrencyInput
              label={t('forms:purchaseCredits.Amount')}
              onChange={setAmount}
              value={amount}
              name="amount"
              error={getError('amount')}
            />
          </div>
        )}
        {isVerificationNeeded ? (
          <div className={css.verificationNotice}>
            <span>
              {isVerificationEnabled ? (
                <KYCNotice isFullWidth />
              ) : (
                <Trans
                  components={[
                    <AppLink
                      key={1}
                      href={urls.amlPolicy}
                      className="font-bold underline"
                    />,
                  ]}
                  i18nKey="common:statuses.purchaseRestricted"
                />
              )}
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmitPayment} className={css.form}>
            {paymentOption === PaymentOption.Card && (
              <CcFields
                countries={countries}
                formErrors={formErrors}
                getError={getError}
                handleSelectedCountryChange={handleSelectedCountryChange}
                selectedCountry={selectedCountry}
              />
            )}
            <CcPaymentSummary
              amount={amount}
              paymentOption={paymentOption}
              selectedCountry={selectedCountry}
            />

            {paymentOption === PaymentOption.Card && (
              <Button
                busy={loadingText !== ''}
                className="mt-8"
                disabled={isVerificationNeeded}
                fullWidth
                size="large"
                type="submit"
              >
                {isCombinedPurchase
                  ? t('common:actions.Purchase')
                  : t('forms:purchaseCredits.Add Money')}
              </Button>
            )}
            {paymentOption === PaymentOption.USDC && (
              <Button
                className="mt-8"
                fullWidth
                onClick={handleCryptoNext}
                size="large"
              >
                {t('forms:purchaseCredits.cryptoNext')}
              </Button>
            )}
          </form>
        )}
      </div>

      {getError('form') && (
        <AlertMessage
          variant="red"
          content={getError('form')}
          className="mt-8"
        />
      )}
    </Async>
  )
}
