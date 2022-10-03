import {
  CheckoutStatus,
  CirclePaymentVerificationOptions,
  CreateCard,
  GetPaymentCardStatus,
  isPurchaseAllowed,
  Payment,
  PaymentCard,
  PaymentItem,
  PaymentOption,
  PaymentStatus,
  PublicKey,
  UserStatusReport,
} from '@algomart/schemas'
import { poll } from '@algomart/shared/utils'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import {
  FormEvent,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { ExtractError } from 'validator-fns'

import { FilterableSelectOption } from '@/components/filterable-select'
import { useAuth } from '@/contexts/auth-context'
import { CheckoutService } from '@/services/checkout-service'
import { encryptCardDetails } from '@/utils/encryption'
import { toJSON } from '@/utils/form-to-json'
import {
  validateCreditsPurchaseAmount,
  validateNewCard,
  validateSavedCard,
} from '@/utils/purchase-validation'

export enum PurchaseStep {
  form = 'form',
  walletConnect = 'walletConnect',
}

export type FormValidation = ExtractError<
  ReturnType<typeof validateNewCard | typeof validateCreditsPurchaseAmount>
> & { form?: string }

export interface usePaymentFlowProps {
  handlePaymentSuccess: (payment: Payment) => Promise<void>
  product: {
    id?: string
    price: number
    type: PaymentItem
  }
  selectedCountry: FilterableSelectOption
  setFormErrors: (value: SetStateAction<FormValidation & unknown>) => void
  userStatus: UserStatusReport
}

export function usePaymentFlow({
  handlePaymentSuccess,
  product,
  selectedCountry,
  setFormErrors,
  userStatus,
}: usePaymentFlowProps) {
  const { user, isAuthenticated } = useAuth()
  const [amount, setAmount] = useState(product.price)
  const { t } = useTranslation()
  const [paymentOption, setPaymentOption] = useState<PaymentOption>(
    PaymentOption.Card
  )
  const { asPath, query, push, pathname } = useRouter()
  const [status, setStatus] = useState<CheckoutStatus>(CheckoutStatus.form) // eslint-disable-line @typescript-eslint/no-unused-vars
  const [destinationAddress, setDestinationAddress] = useState<string | null>(
    null
  )
  const step = (query.step || 'form') as PurchaseStep
  const setStep = useCallback(
    (step: PurchaseStep) => {
      push({ pathname, query: { ...query, step } })
    },
    [push, pathname, query]
  )

  const [loadingText, setLoadingText] = useState('')
  const [promptLeaving, setPromptLeaving] = useState(false)
  const [isVerificationNeeded, setIsVerificationNeeded] = useState<boolean>()
  const [isVerificationEnabled, setIsVerificationEnabled] = useState<boolean>(
    userStatus.isVerificationEnabled
  )
  const validateNewCreditCard = useMemo(
    () => validateNewCard(t, selectedCountry?.value),
    [t, selectedCountry]
  )
  const validateSavedCardFields = useMemo(() => validateSavedCard(t), [t])

  const handleCheckStatus = useCallback(() => {
    const isAllowed = isPurchaseAllowed(userStatus, amount, paymentOption)
    setIsVerificationEnabled(userStatus.isVerificationEnabled)
    setIsVerificationNeeded(!isAllowed)
  }, [amount, paymentOption, userStatus])

  const mapCircleErrors = useCallback(
    (code: string | number) => {
      setFormErrors({})

      const errors = {
        1094: { firstName: t('forms:errors.invalidName') },
        1032: { ccNumber: t('forms:errors.invalidCreditCard') },
        2: { securityCode: t('forms:errors.invalidCVV') },
        1106: { state: t('forms:errors.invalidState') },
        1101: { country: t('forms:errors.invalidCountry') },
      }[code]

      if (errors) {
        setFormErrors(errors)
      }
    },
    [t, setFormErrors]
  )

  /** Validates CVV returns cardId or null */
  const handleExistingCard = useCallback(
    async (data: FormData) => {
      const body = toJSON<{
        securityCode: string
        cardId: string
      }>(data)
      setLoadingText(t('common:statuses.Validating Payment Information'))
      const validation = await validateSavedCardFields(body)
      if (validation.state === 'invalid') {
        setPromptLeaving(false)
        setFormErrors(validation.errors)
        setLoadingText('')
        return null
      }
      setFormErrors({})
      return body.cardId
    },
    [t, validateSavedCardFields, setFormErrors]
  )

  /** Validates new card fields and creates the card on the backend */
  const handleAddCard = useCallback(
    async (data: FormData, publicKeyRecord: PublicKey, saveCard: boolean) => {
      // Convert form data to JSON
      const body = toJSON<
        CreateCard & {
          ccNumber: string
          securityCode: string
        }
      >(data)

      setLoadingText(t('common:statuses.Validating Payment Information'))

      const validation = await validateNewCreditCard(body)

      if (validation.state === 'invalid') {
        setPromptLeaving(false)
        setFormErrors(validation.errors)
        setLoadingText('')
        return null
      }
      setFormErrors({})

      const {
        address1,
        address2,
        ccNumber,
        city,
        country,
        expMonth,
        expYear,
        firstName,
        lastName,
        securityCode,
        state,
        zipCode,
        default: defaultCard,
      } = validation.value

      // Encrypt sensitive details
      const encryptedCard = await encryptCardDetails(
        {
          number: ccNumber as string,
          cvv: securityCode as string,
        },
        publicKeyRecord
      )

      if (saveCard) {
        setLoadingText(t('common:statuses.Saving Payment Information'))
      }
      const card: PaymentCard | null = await CheckoutService.instance
        .createCard({
          billingDetails: {
            name: `${firstName} ${lastName}`,
            city: city,
            country: country,
            line1: address1,
            line2: address2 || '',
            district: state,
            postalCode: zipCode,
          },
          encryptedData: encryptedCard,
          keyId: publicKeyRecord.keyId,
          expirationMonth: Number.parseInt(expMonth, 10),
          expirationYear: Number.parseInt('20' + expYear, 10),
          saveCard: !!saveCard,
          default: defaultCard,
        })
        .catch(async (error) => {
          const response = await error.response.json()
          mapCircleErrors(response.code)
          setPromptLeaving(false)
          return null
        })

      // Poll for card status to confirm avs check is complete
      const cardIdentifier = card?.id

      // Throw error if failed request
      if (!cardIdentifier) {
        throw new Error(t('forms:errors.cardNotFound'))
      }

      const completeWhenNotPendingForCards = (
        card: GetPaymentCardStatus | null
      ) => !(card?.status !== 'pending')

      const cardResponse = await poll<GetPaymentCardStatus | null>(
        async () =>
          await CheckoutService.instance.getCardStatus(cardIdentifier),
        completeWhenNotPendingForCards,
        1000
      )

      // Throw error if there was a failure code
      if (!cardResponse || cardResponse.status === 'failed') {
        throw new Error(t('forms:errors.failedCardCreation'))
      }

      // return the new cardId
      return cardIdentifier
    },
    [mapCircleErrors, t, validateNewCreditCard, setFormErrors]
  )

  /**
   * Submit credit card payment to Circle and poll for completion
   */
  const handleCcPayment = useCallback(
    async (
      securityCode: string,
      cardId: string,
      publicKeyRecord: PublicKey
    ) => {
      if (!cardId) throw new Error('No card selected')

      // Check if verification is required, if the amount results in reaching the daily or total limits
      setLoadingText(t('common:statuses.Checking Verification'))
      if (isVerificationNeeded) {
        throw new Error('Verification required')
      }

      const encryptedData = await encryptCardDetails(
        { cvv: securityCode },
        publicKeyRecord
      )

      // Send request to create
      setLoadingText(t('common:statuses.Submitting Payment'))
      const payment = await CheckoutService.instance.createCcPayment({
        amount: amount.toString(),
        cardId,
        description: `Purchase of ${(amount / 100).toFixed(2)} credits`,
        encryptedData,
        itemId: product.id,
        itemType: product.type,
        keyId: publicKeyRecord.keyId,
        metadata: {
          email: user.email,
        },
        verification: CirclePaymentVerificationOptions.three_d_secure,
      })

      // Throw error if failed request
      if (!payment || !payment.id) {
        throw new Error('Payment not created')
      }

      // Poll for payment status to confirm avs check is complete
      const completeWhenNotPendingForPayments = (payment: Payment | null) =>
        !(payment?.status !== PaymentStatus.Pending)
      const paymentResponse = await poll<Payment | null>(
        async () =>
          await CheckoutService.instance.getPayment(payment.id as string),
        completeWhenNotPendingForPayments,
        1000
      )

      // Throw error if there was a failure code
      if (!paymentResponse || paymentResponse.status === PaymentStatus.Failed) {
        throw new Error('Payment failed')
      }

      return paymentResponse as Payment
    },
    [t, isVerificationNeeded, amount, product?.id, product?.type, user?.email]
  )

  /**
   * - Validate credit card form
   * - Save credit card if requested
   * - Submit payment & poll for completion
   */
  const handleSubmitCcPayment = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const data = new FormData(event.currentTarget)

      setPromptLeaving(true)
      setLoadingText(t('common:statuses.Validating Payment Information'))
      try {
        const validation = await validateCreditsPurchaseAmount(t)({ amount })

        if (validation.state === 'invalid') {
          setPromptLeaving(false)
          setFormErrors(validation.errors)
          setLoadingText('')
          return
        }

        const publicKeyRecord = await CheckoutService.instance.getPublicKey()
        if (!publicKeyRecord)
          throw new Error('Failed to encrypt payment details')

        const body = toJSON<{
          ccNumber: string
          securityCode: string
          cardId: string
          saveCard: boolean
          default: boolean
        }>(data)

        const { securityCode, cardId: submittedCardId } = body
        const saveCard = body.saveCard

        const cardId = submittedCardId
          ? await handleExistingCard(data)
          : await handleAddCard(data, publicKeyRecord, saveCard)

        if (!cardId) return // validation errors

        const payment = await handleCcPayment(
          securityCode,
          cardId,
          publicKeyRecord
        )

        // Remove navigation warning before redirecting.
        setPromptLeaving(false)
        if (payment.status === PaymentStatus.ActionRequired && payment.action) {
          setLoadingText(t('common:statuses.Redirecting for 3DS verification'))
          // Delay redirect to ensure the user can see the new loading text
          setTimeout(() => {
            // Payment requires further action (3DS)
            window.location.assign(payment.action)
          }, 5000)
        } else {
          // CVV check is complete
          await handlePaymentSuccess(payment)
        }
      } catch (error) {
        setFormErrors({
          form: error?.message || 'An unexpected error occurred',
        })
      } finally {
        setLoadingText('')
      }
    },
    [
      amount,
      handleAddCard,
      handleExistingCard,
      handleCcPayment,
      handlePaymentSuccess,
      setFormErrors,
      t,
    ]
  )

  const handleSubmitUsdcPayment = useCallback(
    async (encodedSignedTransaction: string) => {
      // Creating payment for the pending transfer
      setLoadingText(t('common:statuses.Creating Payment'))
      const usdcPayment = await CheckoutService.instance
        .createUsdcPayment({
          encodedSignedTransaction,
          itemId: product.id,
          itemType: product.type,
        })
        .catch(() => null)

      if (!usdcPayment) {
        throw new Error('No usdc payment created')
      }

      try {
        await handlePaymentSuccess(usdcPayment)
      } finally {
        setLoadingText('')
      }
    },
    [handlePaymentSuccess, product.id, product.type, t]
  )

  const handleSetStatus = useCallback(
    (status: CheckoutStatus.form | CheckoutStatus.summary) => {
      setStatus(status)
      const step = status === CheckoutStatus.form ? 'details' : 'summary'
      const path = `${asPath.split('?')[0]}?step=${step}`
      if (path !== asPath) {
        push(path)
      }
    },
    [asPath, push]
  )

  const handleRetry = useCallback(() => {
    setFormErrors({})
    handleSetStatus(CheckoutStatus.form)
    setStep(PurchaseStep.form)
  }, [setStep, handleSetStatus, setFormErrors])

  useEffect(() => {
    if (step === PurchaseStep.walletConnect && isAuthenticated) {
      CheckoutService.instance.createWalletAddress().then((resp) => {
        setDestinationAddress(resp.address)
      })
    }
  }, [step, isAuthenticated])

  useEffect(() => {
    handleCheckStatus()
  }, [amount, handleCheckStatus])

  return {
    amount,
    destinationAddress,
    handleAddCard,
    handleRetry,
    handleSubmitCcPayment,
    handleSubmitUsdcPayment,
    isVerificationEnabled,
    isVerificationNeeded,
    loadingText,
    paymentOption,
    promptLeaving,
    setAmount,
    setLoadingText,
    setPromptLeaving,
    setPaymentOption,
    setStep,
    step,
  }
}
