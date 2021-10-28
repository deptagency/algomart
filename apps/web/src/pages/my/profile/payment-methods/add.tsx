import { GetPaymentCardStatus } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useMemo, useState } from 'react'
import { ExtractError } from 'validator-fns'

import MyProfileLayout from '@/layouts/my-profile-layout'
import checkoutService, { CreateCardRequest } from '@/services/checkout-service'
import MyProfilePaymentMethodsAddTemplate from '@/templates/my-profile-payment-methods-add-template'
import { getExpirationDate } from '@/utils/date-time'
import { encryptCardDetails } from '@/utils/encryption'
import { toJSON } from '@/utils/form-to-json'
import { poll } from '@/utils/poll'
import {
  validateExpirationDate,
  validatePurchaseForm,
} from '@/utils/purchase-validation'

export type CreateStatus = 'loading' | 'form' | 'success' | 'error'

export default function MyProfilePaymentMethodsAddPage() {
  const { t } = useTranslation()
  const [loadingText, setLoadingText] = useState<string>('')
  const validateFormForPurchase = useMemo(() => validatePurchaseForm(t), [t])
  const validateFormExpirationDate = useMemo(
    () => validateExpirationDate(t),
    [t]
  )
  const [formErrors, setFormErrors] = useState<
    Partial<
      ExtractError<
        typeof validateFormForPurchase | typeof validateFormExpirationDate
      >
    >
  >({})
  const [status, setStatus] = useState<CreateStatus>('form')

  const handleAddCard = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const data = new FormData(event.currentTarget)
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
        const {
          ccNumber,
          securityCode,
          address1,
          address2,
          city,
          country,
          expMonth,
          expYear,
          fullName,
          state,
          zipCode,
        } = body

        const validation = await validateFormForPurchase(body)

        if (!validation.isValid && validation.errors) {
          setFormErrors(validation.errors)
          setStatus('form')
          return
        }

        const expirationDate = getExpirationDate(expMonth, expYear)
        const expValidation = await validateFormExpirationDate({
          expirationDate,
        })

        if (!expValidation.isValid && expValidation.errors) {
          setFormErrors(expValidation.errors)
          setStatus('form')
          return
        }

        // Encrypt sensitive details
        const encryptedCard = await encryptCardDetails(
          {
            number: ccNumber as string,
            cvv: securityCode as string,
          },
          publicKeyRecord
        )

        setLoadingText(t('common:statuses.Saving Payment Information'))
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
            saveCard: true,
            state,
            zipCode,
            default: false,
          })
          .catch(async (error) => {
            const response = await error.response.json()
            setFormErrors({})
            switch (response.code) {
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
              default:
                return
            }
          })

        const cardIdentifier = card && 'id' in card ? card.id : card?.externalId

        // Throw error if failed request
        if (!cardIdentifier) {
          throw new Error('Card not found')
        }

        // Poll for card status to confirm avs check is complete
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

        setStatus('success')
      } catch {
        // Error
        setStatus('error')
      }

      setLoadingText('')
    },
    [t, validateFormExpirationDate, validateFormForPurchase]
  )

  return (
    <MyProfileLayout pageTitle={t('common:pageTitles.Add Payment Method')}>
      <MyProfilePaymentMethodsAddTemplate
        formErrors={formErrors}
        loadingText={loadingText}
        onSubmit={handleAddCard}
        setStatus={setStatus}
        status={status}
      />
    </MyProfileLayout>
  )
}
