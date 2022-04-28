import {
  CheckoutMethod,
  CheckoutStatus,
  GetPaymentBankAccountStatus,
  GetPaymentCardStatus,
  PackType,
  Payment,
  PaymentBankAccountInstructions,
  PaymentStatus,
  PublicKey,
  PublishedPack,
} from '@algomart/schemas'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { ExtractError } from 'validator-fns'

import { SelectOption } from '@/components/select/select'
import { useAuth } from '@/contexts/auth-context'
import { useCurrency } from '@/contexts/currency-context'
import { useAnalytics } from '@/hooks/use-analytics'
import { BidService } from '@/services/bid-service'
import {
  CheckoutService,
  CreateBankAccountRequest,
  CreateCardRequest,
} from '@/services/checkout-service'
import { getExpirationDate, isAfterNow } from '@/utils/date-time'
import { encryptCardDetails } from '@/utils/encryption'
import { toJSON } from '@/utils/form-to-json'
import { poll } from '@/utils/poll'
import {
  validateBankAccount,
  validateBidsForm,
  validateBidsFormWithoutCard,
  validateBidsFormWithSavedCard,
  validateExpirationDate,
  validatePurchaseForm,
  validatePurchaseFormWithSavedCard,
} from '@/utils/purchase-validation'

interface PaymentProviderProps {
  auctionPackId?: string | null
  currentBid?: number | null
  release?: PublishedPack
}

export type FormValidation = ExtractError<
  ReturnType<
    | typeof validateBidsForm
    | typeof validatePurchaseForm
    | typeof validateExpirationDate
    | typeof validateBankAccount
    | typeof validateBidsFormWithoutCard
  >
>

export interface PaymentContextProps {
  address: string | null
  auctionPackId?: string | null
  bid: number
  countries: SelectOption[]
  currentBid: number | null
  formErrors?: FormValidation
  getError: (field: string) => string
  handleAddBankAccount(
    data: FormData
  ): Promise<PaymentBankAccountInstructions | undefined>
  handleRetry: () => void
  handleSubmitBid(data: FormData, method: CheckoutMethod): void
  handleSubmitPurchase(data: FormData, isPurchase: boolean): void
  highestBid?: number
  isAuctionActive?: () => boolean
  loadingText: string
  method?: string | string[]
  packId: string | null
  price: number
  promptLeaving: boolean
  release?: PublishedPack
  setAddress(address: string | null): void
  setBid: (bid: number) => void
  setLoadingText: (loadingText: string) => void
  setPackId: (packId: string | null) => void
  setPromptLeaving: (promptLeaving: boolean) => void
  setStatus: (status: CheckoutStatus) => void
  status: CheckoutStatus
}

export const PaymentContext = createContext<PaymentContextProps | null>(null)

export function usePaymentContext() {
  const payment = useContext(PaymentContext)
  if (!payment) throw new Error('PaymentProvider missing')
  return payment
}

export function usePaymentProvider({
  auctionPackId,
  currentBid,
  release,
}: PaymentProviderProps) {
  const analytics = useAnalytics()
  const { t } = useTranslation()
  const { currency } = useCurrency()
  const { asPath, query, push, route } = useRouter()
  const { method } = query
  const auth = useAuth()

  const [packId, setPackId] = useState<string | null>(auctionPackId || null)
  const [status, setStatus] = useState<CheckoutStatus>(CheckoutStatus.form)
  const [loadingText, setLoadingText] = useState<string>('')
  const highestBid = currentBid || 0

  const [bid, setBid] = useState<number>(highestBid)
  const [address, setAddress] = useState<string | null>(null)
  const [promptLeaving, setPromptLeaving] = useState(false)
  const [countries, setCountries] = useState<SelectOption[]>([])
  const validateFormForBankAccount = useMemo(() => validateBankAccount(t), [t])
  const validateFormForPurchase = useMemo(() => validatePurchaseForm(t), [t])
  const validateFormForPurchaseWithSavedCard = useMemo(
    () => validatePurchaseFormWithSavedCard(t),
    [t]
  )
  const validateFormForBids = useMemo(
    () => validateBidsForm(t, highestBid),
    [t, highestBid]
  )
  const validateFormForBidsWithoutCard = useMemo(
    () => validateBidsFormWithoutCard(t, highestBid),
    [t, highestBid]
  )
  const validateFormForBidsWithSavedCard = useMemo(
    () => validateBidsFormWithSavedCard(t, highestBid),
    [t, highestBid]
  )
  const validateFormExpirationDate = useMemo(
    () => validateExpirationDate(t),
    [t]
  )
  const [formErrors, setFormErrors] = useState<FormValidation>()
  const [price, setPrice] = useState(0)

  const getError = useCallback(
    (field: string) =>
      formErrors && field in formErrors ? (formErrors[field] as string) : '',
    [formErrors]
  )

  const findCountries = useCallback(async () => {
    try {
      const countries = await CheckoutService.instance.getCountries()
      if (countries) {
        setCountries(
          countries.map(({ code, name }) => ({
            label: name,
            value: code,
          }))
        )
      } else {
        setCountries([])
      }
    } catch {
      setCountries([])
      setStatus(CheckoutStatus.error)
    }
  }, [])

  useEffect(() => {
    if (auth.user) {
      findCountries()
    }
  }, [auth?.user, findCountries])

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
    handleSetStatus(CheckoutStatus.form)
    setFormErrors({})
    push({
      pathname: route,
      query: { ...query, step: 'details' },
    })
  }, [handleSetStatus, query, push, route])

  const mapCircleErrors = useCallback(
    (code: string | number) => {
      setFormErrors({})

      const errors = {
        1094: { fullName: t('forms:errors.invalidName') },
        1032: { ccNumber: t('forms:errors.invalidCreditCard') },
        2: { securityCode: t('forms:errors.invalidCVV') },
        1106: { state: t('forms:errors.invalidState') },
        1101: { country: t('forms:errors.invalidCountry') },
      }[code]

      if (errors) {
        setFormErrors(errors)
      }
    },
    [t]
  )

  const handlePurchase = useCallback(
    async (
      securityCode: string,
      cardId: string,
      publicKeyRecord: PublicKey
    ) => {
      // Throw error if no price
      if (!release || !release.price) {
        throw new Error('No price provided')
      }

      // Throw error if no card is provided
      if (!cardId) {
        throw new Error('No card selected')
      }

      analytics.addPaymentInfo({
        itemName: release.title,
        value: release.price,
      })

      const encryptedCVV = await encryptCardDetails(
        { cvv: securityCode as string },
        publicKeyRecord
      )

      const verificationEncryptedData = encryptedCVV
      const verificationKeyId = publicKeyRecord.keyId

      // Send request to create
      setLoadingText(t('common:statuses.Submitting Payment'))
      const payment = await CheckoutService.instance.createPayment({
        cardId,
        description: `Purchase of ${release.title} release`,
        packTemplateId: release.templateId,
        verificationEncryptedData,
        verificationKeyId,
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

      return paymentResponse
    },
    [analytics, release, t]
  )

  const handleAddCard = useCallback(
    async (data: FormData, publicKeyRecord: PublicKey, saveCard: boolean) => {
      // Convert form data to JSON
      const body = toJSON<
        CreateCardRequest & {
          ccNumber: string
          securityCode: string
          cardId: string
        }
      >(data)
      const {
        ccNumber,
        securityCode,
        cardId: submittedCardId,
        address1,
        address2,
        city,
        country,
        expMonth,
        expYear,
        fullName,
        state,
        zipCode,
        default: defaultCard,
      } = body

      let cardId: string | undefined

      // If existing card provided, use as card ID
      if (submittedCardId) {
        cardId = submittedCardId
      }

      // Validate expiration date
      if (!submittedCardId) {
        const expirationDate = getExpirationDate(expMonth, expYear)
        const expValidation = await validateFormExpirationDate({
          expirationDate,
        })

        if (expValidation.state === 'invalid') {
          setPromptLeaving(false)
          setFormErrors(expValidation.errors)
          handleSetStatus(CheckoutStatus.form)
          return
        }
      }

      if (ccNumber && securityCode) {
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

        const card = await CheckoutService.instance
          .createCard({
            address1,
            address2,
            city,
            country,
            expMonth,
            expYear,
            fullName,
            keyId: publicKeyRecord.keyId,
            encryptedData: encryptedCard,
            saveCard: !!saveCard,
            state,
            zipCode,
            default: saveCard ? !!defaultCard : false,
          })
          .catch(async (error) => {
            const response = await error.response.json()
            mapCircleErrors(response.code)
            setPromptLeaving(false)
            handleSetStatus(CheckoutStatus.form)
            return null
          })

        // Poll for card status to confirm avs check is complete
        const cardIdentifier = card && 'id' in card ? card.id : card?.externalId

        // Throw error if failed request
        if (!cardIdentifier) {
          throw new Error('Card not found')
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
          throw new Error('Card failed')
        }

        // Define card ID as new card
        cardId = cardIdentifier
      }

      return cardId
    },
    [handleSetStatus, mapCircleErrors, t, validateFormExpirationDate]
  )

  const handleAddBankAccount = useCallback(
    async (data: FormData) => {
      setStatus(CheckoutStatus.loading)
      setLoadingText(t('common:statuses.Validating Payment Information'))
      try {
        const packTemplateId = release?.templateId
        const amount = currentBid || release?.price

        if (!packTemplateId || !amount) {
          setStatus(CheckoutStatus.error)
          return
        }

        // Convert form data to JSON
        const body = toJSON<CreateBankAccountRequest>(data)
        const {
          accountNumber,
          routingNumber,
          fullName,
          address1,
          address2,
          city,
          country,
          state,
          zipCode,
          bankName,
          bankAddress1,
          bankAddress2,
          bankCity,
          bankCountry,
          bankDistrict,
        } = body

        const bankValidation = await validateFormForBankAccount({
          ...body,
          packTemplateId,
          amount,
        })

        if (bankValidation.state === 'invalid') {
          setPromptLeaving(false)
          setFormErrors(bankValidation.errors)
          handleSetStatus(CheckoutStatus.form)
          return
        }

        const bankAccount = await CheckoutService.instance
          .createBankAccount({
            accountNumber,
            routingNumber,
            fullName,
            address1,
            address2,
            city,
            country,
            state,
            zipCode,
            bankName,
            bankAddress1,
            bankAddress2,
            bankCity,
            bankCountry,
            bankDistrict,
            packTemplateId,
            amount,
          })
          .catch(async (error) => {
            const response = await error.response.json()
            mapCircleErrors(response.code)
            setPromptLeaving(false)
            handleSetStatus(CheckoutStatus.form)
            return null
          })

        // Poll for bank account status
        const bankAccountIdentifier = bankAccount?.id

        // Throw error if failed request
        if (!bankAccountIdentifier) {
          throw new Error('Bank account not found')
        }

        const completeWhenNotPendingForAccounts = (
          bankAccount: GetPaymentBankAccountStatus | null
        ) => !(bankAccount?.status !== 'pending')
        const bankAccountResp = await poll<GetPaymentBankAccountStatus | null>(
          async () =>
            await CheckoutService.instance.getBankAccountStatus(
              bankAccountIdentifier
            ),
          completeWhenNotPendingForAccounts,
          1000
        )

        // Throw error if there was a failure code
        if (!bankAccountResp || bankAccountResp.status === 'failed') {
          throw new Error('Bank account process failed')
        }

        // Retrieve instructions for new bank account
        const bankAccountInstructions =
          await CheckoutService.instance.getBankAccountInstructions(
            bankAccountIdentifier
          )

        // Throw error if there was a failure code
        if (!bankAccountInstructions) {
          throw new Error('Bank account instructions not found')
        }

        setStatus(CheckoutStatus.success)

        return bankAccountInstructions
      } catch {
        setStatus(CheckoutStatus.error)
      }
      setLoadingText('')
    },
    [
      t,
      release?.templateId,
      release?.price,
      currentBid,
      validateFormForBankAccount,
      handleSetStatus,
      mapCircleErrors,
    ]
  )

  const handleSubmitBid = useCallback(
    async (data: FormData, method: CheckoutMethod) => {
      setStatus(CheckoutStatus.loading)
      try {
        if (!auctionPackId) {
          throw new Error('Pack not found')
        }

        // Convert form data to JSON
        const body = toJSON<
          CreateCardRequest & {
            ccNumber: string
            securityCode: string
            cardId: string
            bid: number
            confirmBid: boolean
          }
        >(data)
        const { cardId: submittedCardId, bid, saveCard, confirmBid } = body

        // If the bid is within the maximum bid range, submit card details
        if (method === CheckoutMethod.card) {
          setLoadingText(t('common:statuses.Authorizing card'))

          const validation = submittedCardId
            ? await validateFormForBidsWithSavedCard({ ...body, bid })
            : await validateFormForBids({ ...body, bid })

          if (validation.state === 'invalid') {
            setPromptLeaving(false)
            setFormErrors(validation.errors)
            handleSetStatus(CheckoutStatus.form)
            return
          }

          // Get the public key
          const publicKeyRecord = await CheckoutService.instance.getPublicKey()

          // Throw error if no public key
          if (!publicKeyRecord) {
            throw new Error('Failed to encrypt payment details')
          }

          const cardId = await handleAddCard(data, publicKeyRecord, saveCard)

          if (!cardId) {
            throw new Error('No card selected')
          }
        } else {
          setLoadingText(t('common:statuses.Validating Bid'))
          const bidValidation = await validateFormForBidsWithoutCard({
            bid,
            confirmBid,
          })

          if (bidValidation.state === 'invalid') {
            setPromptLeaving(false)
            setFormErrors(bidValidation.errors)
            handleSetStatus(CheckoutStatus.form)
            return
          }
        }

        // Create bid
        const isBidValid = await BidService.instance.addToPack(
          bid,
          auctionPackId
        )

        if (isBidValid) {
          setStatus(CheckoutStatus.success)
        } else {
          setStatus(CheckoutStatus.error)
        }
      } catch {
        // Error
        setStatus(CheckoutStatus.error)
      }

      setLoadingText('')
    },
    [
      auctionPackId,
      currency,
      t,
      validateFormForBidsWithSavedCard,
      validateFormForBids,
      handleAddCard,
      handleSetStatus,
      validateFormForBidsWithoutCard,
    ]
  )

  const handleSubmitPurchase = useCallback(
    async (data: FormData, isPurchase: boolean) => {
      setStatus(CheckoutStatus.loading)
      setLoadingText(t('common:statuses.Validating Payment Information'))
      try {
        // Get the public key
        const publicKeyRecord = await CheckoutService.instance.getPublicKey()

        // Throw error if no public key
        if (!publicKeyRecord) {
          throw new Error('Failed to encrypt payment details')
        }

        // Convert form data to JSON
        const body = toJSON<
          CreateCardRequest & {
            ccNumber: string
            securityCode: string
            cardId: string
          }
        >(data)
        const { securityCode, cardId: submittedCardId } = body
        const saveCard = !isPurchase ? true : body.saveCard

        const validation = submittedCardId
          ? await validateFormForPurchaseWithSavedCard(body)
          : await validateFormForPurchase(body)

        if (validation.state === 'invalid') {
          setPromptLeaving(false)
          setFormErrors(validation.errors)
          handleSetStatus(CheckoutStatus.form)
          return
        }

        const cardId = await handleAddCard(data, publicKeyRecord, saveCard)

        if (!cardId) {
          throw new Error('No card selected')
        }

        if (isPurchase) {
          const payment = await handlePurchase(
            securityCode,
            cardId,
            publicKeyRecord
          )

          // Check if the payment requires further action
          if (
            payment.status === PaymentStatus.ActionRequired &&
            payment.action
          ) {
            // Do not prompt user to leave page, since redirect is expected
            setPromptLeaving(false)
            setStatus(CheckoutStatus.success)
            return window.location.assign(payment.action)
          }

          // Throw error if failed request
          if (!payment || !payment.packId) throw new Error('Pack not available')

          setPackId(payment.packId)
          setStatus(CheckoutStatus.success)
          return
        } else {
          setStatus(CheckoutStatus.success)
          return
        }
      } catch {
        setStatus(CheckoutStatus.error)
      }

      setLoadingText('')
      return
    },
    [
      handleAddCard,
      handlePurchase,
      handleSetStatus,
      t,
      validateFormForPurchase,
      validateFormForPurchaseWithSavedCard,
    ]
  )

  const isAuctionActive = useCallback(
    () =>
      release?.type === PackType.Auction &&
      isAfterNow(new Date(release.auctionUntil as string)),
    [release?.auctionUntil, release?.type]
  )

  useEffect(() => {
    setPrice(release?.type === PackType.Auction ? bid : release?.price || 0)
  }, [bid]) // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(
    () => ({
      address,
      auctionPackId,
      bid,
      countries,
      currentBid: currentBid || null,
      formErrors,
      getError,
      handleAddBankAccount,
      handleRetry,
      handleSubmitBid,
      handleSubmitPurchase,
      highestBid,
      isAuctionActive,
      loadingText,
      method,
      packId,
      price,
      promptLeaving,
      release,
      setAddress,
      setBid,
      setLoadingText,
      setPackId,
      setPromptLeaving,
      setStatus,
      status,
    }),
    [
      address,
      auctionPackId,
      bid,
      countries,
      currentBid,
      formErrors,
      getError,
      handleAddBankAccount,
      handleRetry,
      handleSubmitBid,
      handleSubmitPurchase,
      highestBid,
      isAuctionActive,
      loadingText,
      method,
      packId,
      price,
      promptLeaving,
      release,
      status,
    ]
  )
  return value
}

export function PaymentProvider({
  children,
  auctionPackId,
  currentBid,
  release,
}: {
  children: ReactNode
} & PaymentProviderProps) {
  const value = usePaymentProvider({
    auctionPackId,
    currentBid,
    release,
  })
  return (
    <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>
  )
}
