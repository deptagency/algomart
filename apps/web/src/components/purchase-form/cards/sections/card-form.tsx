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
import Select, { SelectOption } from '@/components/select-input/select-input'
import TextInput from '@/components/text-input/text-input'
import Toggle from '@/components/toggle/toggle'
import { FormValidation, getError } from '@/contexts/payment-context'
import { CheckoutService } from '@/services/checkout-service'
import { getExpirationDate, isAfterNow } from '@/utils/date-time'
import { sortByDefault, sortByExpirationDate } from '@/utils/sort'

export interface CardPurchaseFormProps {
  bid: string | null
  className?: string
  countries: SelectOption[]
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

  const [savedCard, setSavedCard] = useState<string | null>(null)
  const [saveCard, setSaveCard] = useState<boolean>(false)
  const [defaultCard, setDefaultCard] = useState<boolean>(false)
  const [options, setOptions] = useState<SelectOption[]>([])

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
          key: card.id as string,
          label: `${card.network} *${card.lastFour}, ${card.expirationMonth}/${card.expirationYear}`,
        }))

      setOptions([
        { key: '', label: t('forms:fields.savedCard.placeholder') },
        ...cardsList,
      ])

      // If there's a default card provided, select card:
      const isDefault = sortedCards.length > 0 && sortedCards[0].default
      const noFormErrors =
        !formErrors || (formErrors && Object.keys(formErrors).length === 0)
      if (isDefault && noFormErrors) {
        const defaultCard = sortedCards[0].id
        if (defaultCard) setSavedCard(defaultCard)
      }
    }

    run()
  }, [t]) /* eslint-disable-line react-hooks/exhaustive-deps */

  // Handle clearing the card on
  const handleClearCard = () => {
    setSavedCard(null)
  }

  return (
    <div className={className}>
      {getError('bid', formErrors) ? (
        <AlertMessage
          className={css.notification}
          content={getError('bid', formErrors)}
          variant="red"
        />
      ) : null}

      {getError('expirationDate', formErrors) ? (
        <AlertMessage
          className={css.notification}
          content={getError('expirationDate', formErrors)}
          variant="red"
        />
      ) : null}

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
            name="savedCard"
            onChange={setSavedCard}
            label={t('forms:fields.savedCard.label')}
            options={options}
            value={savedCard}
          />
        )}

        {!savedCard ? (
          <>
            <FullName
              formErrors={{ fullName: getError('fullName', formErrors) }}
            />
            <CardDetails
              formErrors={{
                ccNumber: getError('ccNumber', formErrors),
                expMonth: getError('expMonth', formErrors),
                expYear: getError('expYear', formErrors),
                securityCode: getError('securityCode', formErrors),
              }}
            />
          </>
        ) : (
          <div>
            <div className={css.formSingleRow}>
              <TextInput
                className={css.hiddenField}
                name="cardId"
                value={savedCard}
              />
              <TextInput
                error={getError('securityCode', formErrors)}
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
            address1: getError('address1', formErrors),
            city: getError('city', formErrors),
            state: getError('state', formErrors),
            country: getError('country', formErrors),
            zipCode: getError('zipCode', formErrors),
          }}
        />
      )}

      {/* Submit */}
      <Button fullWidth variant="primary" onClick={handleContinue}>
        {t('common:actions.Continue to Summary')}
      </Button>
    </div>
  )
}
