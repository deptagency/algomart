import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'
import { useEffect, useState } from 'react'

import css from './card-form.module.css'

import AlertMessage from '@/components/alert-message/alert-message'
import Button from '@/components/button'
import Heading from '@/components/heading'
import Bid from '@/components/purchase-form/shared/bid'
import BillingAddress from '@/components/purchase-form/shared/billing-address'
import CardDetails from '@/components/purchase-form/shared/card-details'
import FullName from '@/components/purchase-form/shared/full-name'
import Select, { SelectOption } from '@/components/select/select'
import TextInput from '@/components/text-input/text-input'
import Toggle from '@/components/toggle/toggle'
import { FormValidation } from '@/contexts/payment-context'
import { CheckoutService } from '@/services/checkout-service'
import { getExpirationDate, isAfterNow } from '@/utils/date-time'
import { sortByDefault, sortByExpirationDate } from '@/utils/sort'

export interface CardPurchaseFormProps {
  bid: string | null
  className?: string
  countries: { label: string | null; id: string }[]
  formErrors?: FormValidation
  handleContinue: () => void
  initialBid?: string
  isAuctionActive: boolean
  setBid: (bid: string | null) => void
}

export default function CardPurchaseForm({
  bid,
  className,
  countries,
  formErrors,
  handleContinue,
  initialBid,
  isAuctionActive,
  setBid,
}: CardPurchaseFormProps) {
  const { t } = useTranslation()

  const [savedCard, setSavedCard] = useState<SelectOption | null>(null)
  const [saveCard, setSaveCard] = useState<boolean>(false)
  const [defaultCard, setDefaultCard] = useState<boolean>(false)
  const [options, setOptions] = useState<Record<'id' | 'label', string>[]>([])

  useEffect(() => {
    const run = async () => {
      const cards = await CheckoutService.instance.getCards()
      const sortedCardsByExpDate = sortByExpirationDate(cards)
      const sortedCards = sortByDefault(sortedCardsByExpDate)
      const cardsList = sortedCards
        .filter((card) => {
          const expDate = getExpirationDate(
            card.expirationMonth as string,
            card.expirationYear as string
          )
          return isAfterNow(expDate)
        })
        .map((card) => ({
          id: card.id as string,
          label: `${card.network} *${card.lastFour}, ${card.expirationMonth}/${card.expirationYear}`,
        }))

      setOptions([
        { id: '', label: t('forms:fields.savedCard.placeholder') },
        ...cardsList,
      ])

      // If there's a default card provided, select card:
      const isDefault = sortedCards.length > 0 && sortedCards[0].default
      const noFormErrors =
        !formErrors || (formErrors && Object.keys(formErrors).length === 0)
      if (isDefault && noFormErrors) {
        const defaultCard = cardsList.find(
          (card) => card.id === sortedCards[0].id
        )
        if (defaultCard) setSavedCard(defaultCard)
      }
    }

    run()
  }, [t]) /* eslint-disable-line react-hooks/exhaustive-deps */

  // Handle selection/deselection of saved cards
  const handleSavedCardChoice = (option: SelectOption) => {
    setSavedCard(option?.id ? option : null)
  }

  // Handle clearing the card on
  const handleClearCard = async () => {
    setSavedCard(null)
  }

  return (
    <div className={className}>
      {formErrors && 'bid' in formErrors && (
        <AlertMessage
          className={css.notification}
          content={formErrors.bid}
          variant="red"
        />
      )}

      {formErrors && 'expirationDate' in formErrors && (
        <AlertMessage
          className={css.notification}
          content={formErrors.expirationDate}
          variant="red"
        />
      )}

      <div
        className={clsx(css.formSection, {
          [css.formSectionNoMargin]: savedCard,
        })}
      >
        {isAuctionActive && (
          <>
            <Bid
              bid={bid}
              className={css.bid}
              initialBid={initialBid}
              setBid={setBid}
            />
            <p className={css.notice}>{t('forms:fields.bid.description')}</p>
          </>
        )}

        <Heading level={2}>{t('forms:sections.Credit Card')}</Heading>

        {options.length > 1 && (
          <Select
            handleChange={handleSavedCardChoice}
            id="savedCard"
            label={t('forms:fields.savedCard.label')}
            options={options}
            selectedValue={savedCard}
          />
        )}

        {!savedCard ? (
          <>
            <FullName
              formErrors={{
                fullName:
                  formErrors && 'fullName' in formErrors
                    ? (formErrors.fullName as string)
                    : '',
              }}
            />
            <CardDetails
              formErrors={{
                ccNumber:
                  formErrors && 'ccNumber' in formErrors
                    ? (formErrors.ccNumber as string)
                    : '',
                expMonth:
                  formErrors && 'expMonth' in formErrors
                    ? (formErrors.expMonth as string)
                    : '',
                expYear:
                  formErrors && 'expYear' in formErrors
                    ? (formErrors.expYear as string)
                    : '',
                securityCode:
                  formErrors && 'securityCode' in formErrors
                    ? (formErrors.securityCode as string)
                    : '',
              }}
            />
          </>
        ) : (
          <div>
            <div className={css.formSingleRow}>
              <TextInput
                className={css.hiddenField}
                name="cardId"
                value={savedCard.id}
              />
              <TextInput
                error={
                  formErrors && 'securityCode' in formErrors
                    ? (formErrors.securityCode as string)
                    : ''
                }
                label={t('forms:fields.securityCode.label')}
                maxLength={3}
                name="securityCode"
                variant="small"
              />
            </div>
            <Button
              className={css.differentCardLink}
              disablePadding
              onClick={handleClearCard}
              size="small"
              variant="link"
            >
              {t('forms:fields.differentCardLink.label')}
            </Button>
          </div>
        )}

        {!savedCard && (
          <>
            <div className={css.formSingleRow}>
              <Toggle
                id="saveCard"
                name="saveCard"
                checked={saveCard}
                onChange={(checked) => {
                  if (!checked) setDefaultCard(false)
                  setSaveCard(checked)
                }}
                label={t('forms:fields.saveCard.label')}
              />
            </div>
            <div className={clsx(css.formSingleRow, css.defaultCardRow)}>
              <Toggle
                checked={defaultCard}
                id="default"
                name="default"
                disabled={!saveCard}
                onChange={(checked) => setDefaultCard(checked)}
                label={t('forms:fields.defaultCard.helpText')}
              />
            </div>
          </>
        )}
      </div>

      {!savedCard && (
        <BillingAddress
          countries={countries}
          formErrors={{
            address1:
              formErrors && 'address1' in formErrors
                ? (formErrors.address1 as string)
                : '',
            city:
              formErrors && 'city' in formErrors
                ? (formErrors.city as string)
                : '',
            state:
              formErrors && 'state' in formErrors
                ? (formErrors.state as string)
                : '',
            country:
              formErrors && 'country' in formErrors
                ? (formErrors.country as string)
                : '',
            zipCode:
              formErrors && 'zipCode' in formErrors
                ? (formErrors.zipCode as string)
                : '',
          }}
        />
      )}

      {/* Submit */}
      <Button
        fullWidth
        type="button"
        variant="primary"
        onClick={handleContinue}
      >
        {t('common:actions.Continue to Summary')}
      </Button>
    </div>
  )
}
