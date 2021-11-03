import { CheckoutStatus, PublicKey } from '@algomart/schemas'
import {
  GetPaymentCardStatus,
  PackType,
  Payment,
  PublishedPack,
} from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { ExtractError } from 'validator-fns'

import { Analytics } from '@/clients/firebase-analytics'
import { useAuth } from '@/contexts/auth-context'
import authService from '@/services/auth-service'
import bidService from '@/services/bid-service'
import checkoutService, { CreateCardRequest } from '@/services/checkout-service'
import collectibleService from '@/services/collectible-service'
import { getExpirationDate, isAfterNow } from '@/utils/date-time'
import { encryptCardDetails } from '@/utils/encryption'
import { toJSON } from '@/utils/form-to-json'
import { formatFloatToInt } from '@/utils/format-currency'
import { poll } from '@/utils/poll'
import {
  validateBidsForm,
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

interface PaymentContextProps {
  formErrors?: ExtractError<
    ReturnType<
      | typeof validateBidsForm
      | typeof validatePurchaseForm
      | typeof validateExpirationDate
    >
  >
  handleSubmitBid(data: FormData): void
  handleSubmitPassphrase(passphrase: string): Promise<boolean>
  handleSubmitPurchase(data: FormData, isPurchase: boolean): void
  loadingText: string
  packId: string | null
  setStatus: (status: CheckoutStatus) => void
  status: CheckoutStatus
}

export const PaymentContext = createContext<PaymentContextProps | null>(null)

export function usePayment() {
  const payment = useContext(PaymentContext)
  if (!payment) throw new Error('PaymentProvider missing')
  return payment
}

export function usePaymentProvider({
  auctionPackId,
  currentBid,
  release,
}: PaymentProviderProps) {
  const { user } = useAuth()
  const { t } = useTranslation()

  const [packId, setPackId] = useState<string | null>(auctionPackId || null)
  const [passphrase, setPassphrase] = useState<string>('')
  const [status, setStatus] = useState<CheckoutStatus>(
    (release && release.type === PackType.Purchase) ||
      (release &&
        release.type == PackType.Auction &&
        !isAfterNow(new Date(release.auctionUntil as string)))
      ? 'passphrase'
      : 'form'
  )
  const [loadingText, setLoadingText] = useState<string>('')
  const highestBid = currentBid || 0
  const validateFormForPurchase = useMemo(() => validatePurchaseForm(t), [t])
  const validateFormForPurchaseWithSavedCard = useMemo(
    () => validatePurchaseFormWithSavedCard(t),
    [t]
  )
  const validateFormForBids = useMemo(
    () => validateBidsForm(t, highestBid),
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
  const [formErrors, setFormErrors] =
    useState<
      Partial<
        ExtractError<
          | typeof validateFormForPurchase
          | typeof validateFormForBids
          | typeof validateFormExpirationDate
        >
      >
    >()

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
        return setFormErrors(errors)
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

      Analytics.instance.addPaymentInfo({
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
      const payment = await checkoutService.createPayment({
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
        !(payment?.status !== 'pending')
      const paymentResponse = await poll<Payment | null>(
        async () => await checkoutService.getPayment(payment.id as string),
        completeWhenNotPendingForPayments,
        1000
      )

      // Throw error if there was a failure code
      if (!paymentResponse || paymentResponse.status === 'failed') {
        throw new Error('Payment failed')
      }

      return payment
    },
    [release, t]
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

        if (!expValidation.isValid) {
          setFormErrors(expValidation.errors)
          setStatus('form')
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

        const card = await checkoutService
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
            setFormErrors({})
            setStatus('form')
            return
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
          async () => await checkoutService.getCardStatus(cardIdentifier),
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
    [mapCircleErrors, t, validateFormExpirationDate]
  )

  const handleSubmitBid = useCallback(
    async (data: FormData) => {
      setStatus('loading')
      setLoadingText(t('common:statuses.Authorizing card'))
      try {
        if (!auctionPackId) {
          throw new Error('Pack not found')
        }

        // Get the public key
        const publicKeyRecord = await checkoutService.getPublicKey()

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
            bid: number
          }
        >(data)
        const { cardId: submittedCardId, bid: floatBid, saveCard } = body

        const bid = formatFloatToInt(floatBid)

        const validation = submittedCardId
          ? await validateFormForBidsWithSavedCard({ ...body, bid })
          : await validateFormForBids({ ...body, bid })

        if (!validation.isValid) {
          setFormErrors(validation.errors)
          setStatus('form')
          return
        }

        const cardId = await handleAddCard(data, publicKeyRecord, saveCard)

        if (!cardId) {
          throw new Error('No card selected')
        }

        // Create bid
        const isBidValid = await bidService.addToPack(bid, auctionPackId)

        if (isBidValid) {
          setStatus('success')
        } else {
          setStatus('error')
        }
      } catch {
        // Error
        setStatus('error')
      }

      setLoadingText('')
    },
    [
      auctionPackId,
      handleAddCard,
      validateFormForBids,
      validateFormForBidsWithSavedCard,
      t,
    ]
  )

  const handleSubmitPurchase = useCallback(
    async (data: FormData, isPurchase: boolean) => {
      setStatus('loading')
      setLoadingText(t('common:statuses.Validating Payment Information'))
      try {
        // Get the public key
        const publicKeyRecord = await checkoutService.getPublicKey()

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

        if (!validation.isValid) {
          setFormErrors(validation.errors)
          setStatus('form')
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

          // Throw error if failed request
          if (!payment.packId) throw new Error('Pack not available')

          // Transfer asset
          setLoadingText(t('common:statuses.Transferring Asset'))
          const transferIsOK = await collectibleService.transfer(
            payment.packId,
            passphrase
          )

          if (transferIsOK) {
            setPackId(payment.packId)
            setStatus('success')
            if (release) {
              Analytics.instance.purchase({
                itemName: release.title,
                value: release.price,
                paymentId: payment.id,
              })
            }
          } else {
            setStatus('error')
          }
        } else {
          setStatus('success')
        }
      } catch {
        setStatus('error')
      }

      setLoadingText('')
    },
    [
      handleAddCard,
      handlePurchase,
      passphrase,
      release,
      t,
      validateFormForPurchase,
      validateFormForPurchaseWithSavedCard,
    ]
  )

  const handleSubmitPassphrase = useCallback(
    async (passphrase: string) => {
      setLoadingText(t('common:statuses.Verifying Passphrase'))
      setStatus('loading')
      setPassphrase(passphrase)
      const isValidPassphrase = await authService.verifyPassphrase(
        user?.uid as string,
        passphrase
      )
      if (isValidPassphrase) {
        setStatus('form')
      } else {
        setStatus('passphrase')
      }
      return isValidPassphrase
    },
    [t, user?.uid]
  )

  const value = useMemo(
    () => ({
      formErrors,
      handleSubmitBid,
      handleSubmitPassphrase,
      handleSubmitPurchase,
      loadingText,
      packId,
      setStatus,
      status,
    }),
    [
      formErrors,
      handleSubmitBid,
      handleSubmitPassphrase,
      handleSubmitPurchase,
      loadingText,
      packId,
      setStatus,
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
