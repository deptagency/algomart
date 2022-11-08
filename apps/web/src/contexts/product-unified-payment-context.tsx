import {
  CheckoutStatus,
  CircleTransferStatus,
  Payment,
  PaymentItem,
  PaymentOption,
  PublicKey,
  UserAccountTransfer,
  UserStatusReport,
} from '@algomart/schemas'
import { useRouter } from 'next/router'
import {
  createContext,
  FormEvent,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { ExtractError } from 'validator-fns'

import { usePendingCreditsContext } from './pending-credits-context'

import { FilterableSelectOption } from '@/components/filterable-select'
import { useAuth } from '@/contexts/auth-context'
import { useCountriesDropdown } from '@/hooks/payments/use-countries-dropdown'
import { PurchaseStep, usePaymentFlow } from '@/hooks/payments/use-payment-flow'
import { CheckoutService } from '@/services/checkout-service'
import { poll } from '@/utils/poll'
import {
  validateCreditsPurchaseAmount,
  validateNewCard,
} from '@/utils/purchase-validation'
import { hashEvents } from '@/utils/urls'

export type FormValidation = ExtractError<
  ReturnType<typeof validateNewCard | typeof validateCreditsPurchaseAmount>
> & { form?: string }

interface Product {
  id: string
  price: number
  title: string
  type: PaymentItem
}

interface ProductUnifiedPaymentProviderProps {
  product?: Product
  userStatus: UserStatusReport
}

export interface ProductUnifiedPaymentContextProps {
  product?: Product
  countries: FilterableSelectOption[]
  destinationAddress: string | null
  formErrors?: FormValidation
  getError: (field: string) => string
  handleAddCard: (
    data: FormData,
    publicKeyRecord: PublicKey,
    saveCard: boolean
  ) => Promise<string | null>
  handlePaymentSuccess: (payment: Payment) => void
  handleRetry: () => void
  handleSelectedCountryChange: (countryCode: string) => void
  handleSubmitCcPayment(event: FormEvent<HTMLFormElement>): Promise<void>
  handleSubmitUsdcPayment(encodedSignedTransaction: string): Promise<void>
  isVerificationNeeded: boolean
  isVerificationEnabled: boolean
  loadingText: string
  paymentOption: PaymentOption
  purchasedProductId: string | null
  reset: () => void
  selectedCountry: FilterableSelectOption
  setFormErrors(errors: FormValidation): void
  setLoadingText: (loadingText: string) => void
  setPaymentOption: (paymentOption: PaymentOption) => void
  setPurchasedProductId: (id: string | null) => void
  setStatus: (status: CheckoutStatus) => void
  setStep: (step: PurchaseStep) => void
  status: CheckoutStatus
  step: PurchaseStep
  userStatus: UserStatusReport
}

export const ProductUnifiedPaymentContext =
  createContext<ProductUnifiedPaymentContextProps | null>(null)

export function useProductUnifiedPaymentContext() {
  const payment = useContext(ProductUnifiedPaymentContext)
  if (!payment) throw new Error('ProductUnifiedPaymentProvider missing')
  return payment
}

export function useProductUnifiedPaymentProvider({
  product,
  userStatus,
}: ProductUnifiedPaymentProviderProps) {
  const { push } = useRouter()
  const { reloadProfile } = useAuth()
  const { findPendingCredits } = usePendingCreditsContext()

  const [purchasedProductId, setPurchasedProductId] = useState<string | null>(
    null
  )
  const [status, setStatus] = useState<CheckoutStatus>(CheckoutStatus.form)

  const [formErrors, setFormErrors] = useState<FormValidation>()
  const { countries, handleSelectedCountryChange, selectedCountry } =
    useCountriesDropdown({ formErrors, setFormErrors })

  /**
   * At this point the transfer is NOT guaranteed to be complete.
   * Payment returns with listing id
   * Use this to poll to find proper transfer and wait for success
   */
  const handlePaymentSuccess = useCallback(
    async (payment: Payment) => {
      // Poll for payment status to confirm avs check is complete
      const completeWhenTransferAvailable = (
        transfer: UserAccountTransfer | null
      ) => !transfer || transfer?.status === CircleTransferStatus.Pending

      const transfer = await poll<UserAccountTransfer | null>(
        async () =>
          await CheckoutService.instance.getUserAccountTransferByEntityId(
            payment.itemId as string
          ),
        completeWhenTransferAvailable,
        1000
      )

      // Throw error if there was a failure code
      if (!transfer || transfer.status === CircleTransferStatus.Failed) {
        throw new Error('Payment failed')
      } else {
        setPurchasedProductId(transfer.entityId)
        await reloadProfile()
        setStatus(CheckoutStatus.success)
        push(hashEvents.unifiedPaymentSuccess, undefined, { scroll: false })
        findPendingCredits()
      }
    },
    [findPendingCredits, push, reloadProfile]
  )

  const {
    destinationAddress,
    handleAddCard,
    handleRetry,
    handleSubmitCcPayment,
    handleSubmitUsdcPayment,
    isVerificationEnabled,
    isVerificationNeeded,
    loadingText,
    paymentOption,
    setLoadingText,
    setStep,
    setPaymentOption,
    step,
  } = usePaymentFlow({
    handlePaymentSuccess,
    product,
    selectedCountry,
    setFormErrors,
    userStatus,
  })

  const getError = useCallback(
    (field: string) =>
      formErrors && field in formErrors ? (formErrors[field] as string) : '',
    [formErrors]
  )

  const reset = useCallback(() => {
    setStatus(CheckoutStatus.form)
  }, [])

  const value = useMemo(
    () => ({
      product,
      countries,
      destinationAddress,
      formErrors,
      getError,
      handleAddCard,
      handlePaymentSuccess,
      handleRetry,
      handleSelectedCountryChange,
      handleSubmitCcPayment,
      handleSubmitUsdcPayment,
      isVerificationEnabled,
      isVerificationNeeded,
      loadingText,
      paymentOption,
      purchasedProductId,
      reset,
      selectedCountry,
      setFormErrors,
      setLoadingText,
      setPaymentOption,
      setPurchasedProductId,
      setStatus,
      setStep,
      status,
      step,
      userStatus,
    }),
    [
      product,
      countries,
      destinationAddress,
      formErrors,
      getError,
      handleAddCard,
      handlePaymentSuccess,
      handleRetry,
      handleSelectedCountryChange,
      handleSubmitCcPayment,
      handleSubmitUsdcPayment,
      isVerificationEnabled,
      isVerificationNeeded,
      loadingText,
      paymentOption,
      purchasedProductId,
      reset,
      selectedCountry,
      setFormErrors,
      setLoadingText,
      setPaymentOption,
      setPurchasedProductId,
      setStatus,
      setStep,
      status,
      step,
      userStatus,
    ]
  )

  return value
}

export function ProductUnifiedPaymentProvider({
  children,
  product,
  userStatus,
}: { children: ReactNode } & ProductUnifiedPaymentProviderProps) {
  const value = useProductUnifiedPaymentProvider({
    product,
    userStatus,
  })
  return (
    <ProductUnifiedPaymentContext.Provider value={value}>
      {children}
    </ProductUnifiedPaymentContext.Provider>
  )
}
