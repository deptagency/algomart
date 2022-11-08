import {
  Payment,
  PaymentItem,
  PaymentOption,
  PublicKey,
  UserStatusReport,
} from '@algomart/schemas'
import { useRouter } from 'next/router'
import {
  createContext,
  FormEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { ExtractError } from 'validator-fns'

import { usePendingCreditsContext } from './pending-credits-context'

import { FilterableSelectOption } from '@/components/filterable-select'
import { useAuth } from '@/contexts/auth-context'
import { useCountriesDropdown } from '@/hooks/payments/use-countries-dropdown'
import { usePaymentFlow } from '@/hooks/payments/use-payment-flow'
import { CheckoutService } from '@/services/checkout-service'
import {
  validateCreditsPurchaseAmount,
  validateNewCard,
} from '@/utils/purchase-validation'
import { urls } from '@/utils/urls'

export enum PurchaseStep {
  form = 'form',
  walletConnect = 'walletConnect',
}

export type FormValidation = ExtractError<
  ReturnType<typeof validateNewCard | typeof validateCreditsPurchaseAmount>
> & { form?: string }

interface PurchaseCreditsProviderProps {
  initialAmount?: number
  onCreditPurchaseSuccess?: (paymentId: string) => void
  userStatus: UserStatusReport
}

export interface PurchaseCreditsContextProps {
  amount: number | null
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
  handleSubmitCcPayment(event: FormEvent<HTMLFormElement>): void
  handleSubmitUsdcPayment(encodedSignedTransaction: string): Promise<void>
  isVerificationNeeded: boolean
  isVerificationEnabled: boolean
  loadingText: string
  paymentOption: PaymentOption
  promptLeaving: boolean
  selectedCountry: FilterableSelectOption
  setAmount(amount: number): void
  setFormErrors(errors: FormValidation): void
  setLoadingText: (loadingText: string) => void
  setPaymentOption: (paymentOption: PaymentOption) => void
  setPromptLeaving: (promptLeaving: boolean) => void
  setStep: (step: PurchaseStep) => void
  step: PurchaseStep
  userStatus: UserStatusReport
}

export const PurchaseCreditsContext =
  createContext<PurchaseCreditsContextProps | null>(null)

export function usePurchaseCreditsContext() {
  const payment = useContext(PurchaseCreditsContext)
  if (!payment) throw new Error('PurchaseCreditsProvider missing')
  return payment
}

export function usePurchaseCreditsProvider({
  onCreditPurchaseSuccess,
  initialAmount = 2500,
  userStatus,
}: PurchaseCreditsProviderProps) {
  const { findPendingCredits } = usePendingCreditsContext()
  const { isAuthenticated } = useAuth()

  const { query, push, pathname } = useRouter()

  const step = (query.step || 'form') as PurchaseStep
  const setStep = useCallback(
    (step: PurchaseStep) => {
      push({ pathname, query: { ...query, step } })
    },
    [push, pathname, query]
  )

  const [destinationAddress, setDestinationAddress] = useState<string | null>(
    null
  )
  const [formErrors, setFormErrors] = useState<FormValidation>()

  const { countries, handleSelectedCountryChange, selectedCountry } =
    useCountriesDropdown({ formErrors, setFormErrors })

  /**
   * At this point the transfer is NOT guaranteed to be complete.
   * Redirect to pending page and wait for the transfer to complete unless a
   * `onCreditPurchaseSuccess` callback has been provided.
   */
  const handlePaymentSuccess = useCallback(
    async (payment: Payment) => {
      findPendingCredits()
      if (onCreditPurchaseSuccess) {
        onCreditPurchaseSuccess(payment.id)
      } else {
        push(`${urls.paymentTransferPending}?paymentId=${payment.id}`)
      }
    },
    [push, onCreditPurchaseSuccess, findPendingCredits]
  )

  const {
    amount,
    handleAddCard,
    handleRetry,
    handleSubmitCcPayment,
    handleSubmitUsdcPayment,
    isVerificationEnabled,
    isVerificationNeeded,
    loadingText,
    paymentOption,
    promptLeaving,
    setPromptLeaving,
    setAmount,
    setLoadingText,
    setPaymentOption,
  } = usePaymentFlow({
    handlePaymentSuccess,
    product: {
      price: initialAmount,
      type: PaymentItem.Credits,
    },
    selectedCountry,
    setFormErrors,
    userStatus,
  })

  useEffect(() => {
    if (query.redirect) {
      localStorage.setItem(
        'redirectAfterCreditPurchase',
        decodeURIComponent(query.redirect as string)
      )
    } else {
      localStorage.removeItem('redirectAfterCreditPurchase')
    }
  })

  useEffect(() => {
    if (step === PurchaseStep.walletConnect && isAuthenticated) {
      CheckoutService.instance.createWalletAddress().then((resp) => {
        setDestinationAddress(resp.address)
      })
    }
  }, [step, isAuthenticated])

  const getError = useCallback(
    (field: string) =>
      formErrors && field in formErrors ? (formErrors[field] as string) : '',
    [formErrors]
  )

  const value = useMemo(
    () => ({
      amount,
      countries,
      destinationAddress,
      formErrors,
      getError,
      handleAddCard,
      handleRetry,
      handlePaymentSuccess,
      handleSelectedCountryChange,
      handleSubmitCcPayment,
      handleSubmitUsdcPayment,
      isVerificationEnabled,
      isVerificationNeeded,
      loadingText,
      paymentOption,
      promptLeaving,
      selectedCountry,
      setAmount,
      setFormErrors,
      setLoadingText,
      setPaymentOption,
      setPromptLeaving,
      setStep,
      step,
      userStatus,
    }),
    [
      amount,
      countries,
      destinationAddress,
      formErrors,
      getError,
      handleAddCard,
      handleRetry,
      handlePaymentSuccess,
      handleSelectedCountryChange,
      handleSubmitCcPayment,
      handleSubmitUsdcPayment,
      isVerificationEnabled,
      isVerificationNeeded,
      loadingText,
      paymentOption,
      promptLeaving,
      selectedCountry,
      setAmount,
      setFormErrors,
      setLoadingText,
      setPaymentOption,
      setPromptLeaving,
      setStep,
      step,
      userStatus,
    ]
  )

  return value
}

export function PurchaseCreditsProvider({
  children,
  initialAmount,
  onCreditPurchaseSuccess,
  userStatus,
}: { children: React.ReactNode } & PurchaseCreditsProviderProps) {
  const value = usePurchaseCreditsProvider({
    initialAmount,
    onCreditPurchaseSuccess,
    userStatus,
  })
  return (
    <PurchaseCreditsContext.Provider value={value}>
      {children}
    </PurchaseCreditsContext.Provider>
  )
}
