import { DEFAULT_CURRENCY, PackType, PublishedPack } from '@algomart/schemas'
import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useEffect, useState } from 'react'
import { ExtractError } from 'validator-fns'

import css from './purchase-form.module.css'

import Button from '@/components/button'
import CardDetails from '@/components/card-details'
import BillingAddress from '@/components/card-details/billing-address'
import CurrencyInput from '@/components/currency-input/currency-input'
import Heading from '@/components/heading'
import Notification from '@/components/notification/notification'
import Select, { SelectOption } from '@/components/select/select'
import TextInput from '@/components/text-input/text-input'
import Toggle from '@/components/toggle/toggle'
import { useLocale } from '@/hooks/useLocale'
import checkoutService from '@/services/checkout-service'
import { getExpirationDate, isAfterNow } from '@/utils/date-time'
import { formatCurrency, formatIntToFloat } from '@/utils/format-currency'
import {
  validateBidsForm,
  validateExpirationDate,
  validatePurchaseForm,
} from '@/utils/purchase-validation'
import { sortByDefault, sortByExpirationDate } from '@/utils/sort'

export interface PurchaseFormProps {
  formErrors?: ExtractError<
    ReturnType<
      | typeof validateBidsForm
      | typeof validatePurchaseForm
      | typeof validateExpirationDate
    >
  >
  currentBid: number | null
  onSubmit(event: FormEvent<HTMLFormElement>): void
  release: PublishedPack
}

export default function PurchaseForm({
  formErrors,
  currentBid,
  onSubmit,
  release,
}: PurchaseFormProps) {
  const locale = useLocale()
  const { t, lang } = useTranslation()

  const initialBid = currentBid ? formatIntToFloat(currentBid) : '0'

  const [bid, setBid] = useState<string | null>(initialBid)
  const [savedCard, setSavedCard] = useState<SelectOption | null>(null)
  const [saveCard, setSaveCard] = useState<boolean>(false)
  const [defaultCard, setDefaultCard] = useState<boolean>(false)
  const [options, setOptions] = useState<Record<'id' | 'label', string>[]>([])
  const price = release.type === PackType.Auction ? bid : release.price
  const isAuctionActive =
    release.type === PackType.Auction &&
    isAfterNow(new Date(release.auctionUntil as string))

  useEffect(() => {
    const run = async () => {
      const cards = await checkoutService.getCards()
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
    <form className={css.form} onSubmit={onSubmit}>
      {formErrors && 'bid' in formErrors && (
        <Notification
          className={css.notification}
          content={formErrors.bid}
          variant="red"
        />
      )}

      {formErrors && 'expirationDate' in formErrors && (
        <Notification
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
            <CurrencyInput
              className={css.bid}
              decimalsLimit={2}
              handleChange={(value) => setBid(value)}
              helpText={
                currentBid
                  ? t('forms:fields.bid.helpTextCurrentBid', {
                      amount: formatCurrency(initialBid, lang),
                    })
                  : undefined
              }
              id="bid-input"
              intlConfig={{ locale, currency: DEFAULT_CURRENCY }}
              label={t('forms:fields.bid.label')}
              name="bid-input"
              value={bid || ''}
              variant={'small'}
            />
            {/* Force formData to be built from this "unmasked" value */}
            <input id="bid" name="bid" type="hidden" value={bid as string} />
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
                fullName:
                  formErrors && 'fullName' in formErrors
                    ? (formErrors.fullName as string)
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

      {/* Price */}
      <div className={css.priceContainer}>
        <p className={css.priceLabel}>{t('release:Total')}</p>
        <p className={css.priceValue}>{formatCurrency(price, lang)}</p>
      </div>

      {/* Submit */}
      <Button disabled={!release} fullWidth type="submit" variant="primary">
        {isAuctionActive
          ? t('common:actions.Place Bid')
          : t('common:actions.Purchase')}
      </Button>
    </form>
  )
}
