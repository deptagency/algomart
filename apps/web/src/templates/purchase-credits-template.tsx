import useTranslation from 'next-translate/useTranslation'

import MainPanelHeader from '@/components/main-panel-header'
import CcPaymentForm from '@/components/payment-form/cc-payment-form'
import UsdcPaymentForm from '@/components/payment-form/usdc-payment-form'
import {
  PurchaseStep,
  usePurchaseCreditsContext,
} from '@/contexts/purchase-credits-context'
import { urls } from '@/utils/urls'

export default function PurchaseCreditsTemplate() {
  const { t } = useTranslation()

  const {
    amount,
    countries,
    formErrors,
    getError,
    destinationAddress,
    isVerificationEnabled,
    isVerificationNeeded,
    handlePaymentSuccess,
    handleSelectedCountryChange,
    handleSubmitCcPayment,
    handleSubmitUsdcPayment,
    loadingText,
    paymentOption,
    selectedCountry,
    setAmount,
    setFormErrors,
    setLoadingText,
    setPaymentOption,
    setStep,
    step,
  } = usePurchaseCreditsContext()

  return (
    <div>
      <MainPanelHeader
        title={t('forms:purchaseCredits.Add Money')}
        backLink={urls.myWallet}
      />

      {step === PurchaseStep.form && (
        <CcPaymentForm
          amount={amount}
          countries={countries}
          formErrors={formErrors}
          getError={getError}
          isCombinedPurchase={false}
          isVerificationEnabled={isVerificationEnabled}
          isVerificationNeeded={isVerificationNeeded}
          handleSelectedCountryChange={handleSelectedCountryChange}
          handleSubmitPayment={handleSubmitCcPayment}
          loadingText={loadingText}
          paymentOption={paymentOption}
          selectedCountry={selectedCountry}
          setAmount={setAmount}
          setFormErrors={setFormErrors}
          setPaymentOption={setPaymentOption}
          setStep={setStep}
        />
      )}

      {step === PurchaseStep.walletConnect && (
        <UsdcPaymentForm
          amount={amount}
          destinationAddress={destinationAddress}
          handlePurchaseSuccess={handlePaymentSuccess}
          handleSubmitPayment={handleSubmitUsdcPayment}
          loadingText={loadingText}
          setLoadingText={setLoadingText}
        />
      )}
    </div>
  )
}
