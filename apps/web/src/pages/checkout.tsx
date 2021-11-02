import {
  GetPaymentCardStatus,
  PackAuction,
  PackStatus,
  PackType,
  Payment,
  PublishedPack,
} from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ExtractError } from 'validator-fns'

import { ApiClient } from '@/clients/api-client'
import { Analytics } from '@/clients/firebase-analytics'
import { useAuth } from '@/contexts/auth-context'
import { usePaymentProvider } from '@/contexts/payment-context'
import DefaultLayout from '@/layouts/default-layout'
import {
  getAuthenticatedUser,
  handleUnauthenticatedRedirect,
} from '@/services/api/auth-service'
import authService from '@/services/auth-service'
import bidService from '@/services/bid-service'
import checkoutService, { CreateCardRequest } from '@/services/checkout-service'
import collectibleService from '@/services/collectible-service'
import CheckoutTemplate from '@/templates/checkout-template'
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
import { urls } from '@/utils/urls'

export interface CheckoutPageProps {
  auctionPackId: string | null
  currentBid: number | null
  release: PublishedPack
}

export type CheckoutStatus =
  | 'passphrase'
  | 'purchase'
  | 'loading'
  | 'success'
  | 'error'

export default function Checkout({
  release,
  currentBid,
  auctionPackId,
}: CheckoutPageProps) {
  const { user } = useAuth()
  const { t } = useTranslation()
  const {} = usePaymentProvider()

  const [packId, setPackId] = useState<string | null>(auctionPackId)
  const [passphrase, setPassphrase] = useState<string>('')
  const [status, setStatus] = useState<CheckoutStatus>(
    release.type === PackType.Auction &&
      isAfterNow(new Date(release.auctionUntil as string))
      ? 'purchase'
      : 'passphrase'
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

      switch (code) {
        case 1094:
          return setFormErrors({
            fullName: t('forms:errors.invalidName'),
          })
        case 1032:
          return setFormErrors({
            ccNumber: t('forms:errors.invalidCreditCard'),
          })
        case 2:
          return setFormErrors({
            securityCode: t('forms:errors.invalidCVV'),
          })
        case 1106:
          return setFormErrors({ state: t('forms:errors.invalidState') })
        case 1101:
          return setFormErrors({
            country: t('forms:errors.invalidCountry'),
          })
      }
    },
    [t]
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
        setStatus('purchase')
      } else {
        setStatus('passphrase')
      }
      return isValidPassphrase
    },
    [t, user?.uid]
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
        const {
          ccNumber,
          securityCode,
          saveCard,
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
          bid: floatBid,
          default: defaultCard,
        } = body

        const bid = formatFloatToInt(floatBid)

        const validation = submittedCardId
          ? await validateFormForBidsWithSavedCard({ ...body, bid })
          : await validateFormForBids({ ...body, bid })

        if (!validation.isValid) {
          setFormErrors(validation.errors)
          setStatus('purchase')
          return
        }

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
            setStatus('purchase')
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
              setStatus('purchase')
              return
            })

          const cardIdentifier =
            card && 'id' in card ? card.id : card?.externalId

          // Throw error if failed request
          if (!cardIdentifier) {
            throw new Error('Card not found')
          }

          // Define card ID as new card
          cardId = cardIdentifier
        }

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
      mapCircleErrors,
      validateFormForBids,
      validateFormForBidsWithSavedCard,
      validateFormExpirationDate,
      t,
    ]
  )

  const handleSubmitPurchase = useCallback(
    async (data: FormData) => {
      setStatus('loading')
      setLoadingText(t('common:statuses.Validating Payment Information'))
      try {
        // Throw error if no price
        if (!release.price) {
          throw new Error('No price provided')
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
          }
        >(data)
        const {
          ccNumber,
          securityCode,
          saveCard,
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

        const encryptedCVV = await encryptCardDetails(
          { cvv: securityCode as string },
          publicKeyRecord
        )
        let cardId: string | undefined

        const verificationEncryptedData = encryptedCVV
        const verificationKeyId = publicKeyRecord.keyId

        // If existing card provided, use as card ID
        if (submittedCardId) {
          cardId = submittedCardId
        }

        const validation = submittedCardId
          ? await validateFormForPurchaseWithSavedCard(body)
          : await validateFormForPurchase(body)

        if (!validation.isValid) {
          setFormErrors(validation.errors)
          setStatus('purchase')
          return
        }
        Analytics.instance.addPaymentInfo({
          itemName: release.title,
          value: release.price,
        })

        // Validate expiration date
        if (!submittedCardId) {
          const expirationDate = getExpirationDate(expMonth, expYear)
          const expValidation = await validateFormExpirationDate({
            expirationDate,
          })

          if (!expValidation.isValid) {
            setFormErrors(expValidation.errors)
            setStatus('purchase')
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
              setStatus('purchase')
              return
            })

          // Poll for card status to confirm avs check is complete
          const cardIdentifier =
            card && 'id' in card ? card.id : card?.externalId

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

        if (!cardId) {
          throw new Error('No card selected')
        }

        // Send request to create
        setLoadingText(t('common:statuses.Submitting Payment'))
        const payment = await checkoutService.createPayment({
          cardId,
          description: `Purchase of ${release.title} release`,
          packTemplateId: release.templateId,
          saveCard: !!saveCard,
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

        // Transfer asset
        setLoadingText(t('common:statuses.Transferring Asset'))
        // Throw error if failed request
        if (!payment.packId) throw new Error('Pack not available')
        const transferIsOK = await collectibleService.transfer(
          payment.packId,
          passphrase
        )

        if (transferIsOK) {
          setPackId(payment.packId)
          setStatus('success')
          Analytics.instance.purchase({
            itemName: release.title,
            value: release.price,
            paymentId: payment.id,
          })
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
      mapCircleErrors,
      passphrase,
      release,
      t,
      validateFormForPurchase,
      validateFormExpirationDate,
      validateFormForPurchaseWithSavedCard,
    ]
  )

  useEffect(() => {
    Analytics.instance.beginCheckout({
      itemName: release.title,
      value: currentBid ?? release.price,
    })
  }, [currentBid, release])

  return (
    <DefaultLayout
      pageTitle={
        release.type === PackType.Auction
          ? t('common:pageTitles.Placing Bid', { name: release.title })
          : t('common:pageTitles.Checking Out', { name: release.title })
      }
      panelPadding
    >
      <CheckoutTemplate
        currentBid={currentBid}
        packId={packId}
        release={release}
      />
    </DefaultLayout>
  )
}
export const getServerSideProps: GetServerSideProps<CheckoutPageProps> = async (
  context
) => {
  // Verify authentication
  const user = await getAuthenticatedUser(context)
  if (!user) {
    return handleUnauthenticatedRedirect(context.resolvedUrl)
  }

  // Get release based on search query
  const { pack: packSlug } = context.query
  if (typeof packSlug === 'string') {
    const { packs } = await ApiClient.instance.getPublishedPacks({
      locale: context.locale,
      slug: packSlug,
    })
    if (packs.length > 0) {
      const packTemplate = packs[0]
      // If there are no remaining packs, prohibit purchase
      if (!packTemplate.available) {
        return {
          redirect: {
            destination: urls.release.replace(':packSlug', packSlug),
            permanent: false,
          },
        }
      }

      let pack: PackAuction | null = null
      if (packTemplate.type === PackType.Auction) {
        // If the auction has ended, only the winning bidder can purchase
        pack = await ApiClient.instance.getAuctionPack(packTemplate.templateId)
        const auctionEnded = packTemplate.status === PackStatus.Expired
        const isWinningBidder = pack.activeBid?.externalId === user.externalId
        if (
          (auctionEnded && !isWinningBidder) ||
          pack.ownerExternalId === user.externalId
        ) {
          return {
            redirect: {
              destination: urls.release.replace(':packSlug', packSlug),
              permanent: false,
            },
          }
        }
      } else if (packTemplate.onePackPerCustomer) {
        // If a non-auction pack has already been purchased once and only
        // allows one per customer, redirect to release page
        const { total } = await ApiClient.instance.getPacksByOwnerId(
          user.externalId,
          { templateIds: [packTemplate.templateId] }
        )
        if (total > 0) {
          return {
            redirect: {
              destination: urls.release.replace(':packSlug', packSlug),
              permanent: false,
            },
          }
        }
      }
      return {
        props: {
          release: packTemplate,
          currentBid:
            typeof pack?.activeBid?.amount === 'number'
              ? pack?.activeBid?.amount
              : null,
          auctionPackId: pack?.packId || null,
        },
      }
    }
  }

  return {
    redirect: {
      destination: urls.home,
      permanent: false,
    },
  }
}
