import { PaymentCards } from '@algomart/schemas'
import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'
import { useEffect, useState } from 'react'

import { FilterableSelectOption } from '../filterable-select'

import css from './cc-payment-form.module.css'

import AlertMessage from '@/components/alert-message/alert-message'
import CreditCardNetworkLogo from '@/components/credit-card-network-logo/credit-card-network-logo'
import { H2 } from '@/components/heading'
import InputField from '@/components/input-field'
import BillingAddress from '@/components/payment-form/form-fields/billing-address'
import CardDetails from '@/components/payment-form/form-fields/card-details'
import FullName from '@/components/payment-form/form-fields/full-name'
import SelectField, { SelectOption } from '@/components/select-field'
import Toggle from '@/components/toggle/toggle'
import { FormValidation } from '@/contexts/product-unified-payment-context'
import { CheckoutService } from '@/services/checkout-service'
import { getExpirationDate, isAfterNow } from '@/utils/date-time'
import { sortByDefault, sortByExpirationDate } from '@/utils/sort'

export interface CcFieldsProps {
  countries: FilterableSelectOption[]
  formErrors?: FormValidation
  getError: (field: string) => string
  handleSelectedCountryChange: (countryCode: string) => void
  selectedCountry: FilterableSelectOption
}

export default function CcFields({
  countries,
  formErrors,
  getError,
  handleSelectedCountryChange,
  selectedCountry,
}: CcFieldsProps) {
  const { t } = useTranslation()

  const [savedCards, setSavedCards] = useState<PaymentCards>([])
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [shouldSaveCard, setShouldSaveCard] = useState(false)
  const [defaultCard, setDefaultCard] = useState(false)
  const [options, setOptions] = useState<SelectOption[]>([])

  const handleClearCard = () => setSelectedCard(null)

  useEffect(() => {
    const run = async () => {
      // we expect an abort error in strict mode because the component will be mounted twice
      // this error handling could definitely be better, but for now, just return an empty list if
      // there's an error
      const cards = await CheckoutService.instance.getCards().catch(() => [])
      const sortedCardsByExpDate = sortByExpirationDate(cards)
      const sortedCards = sortByDefault(sortedCardsByExpDate)
      const cardsList: SelectOption[] = sortedCards
        .filter((card) =>
          isAfterNow(
            getExpirationDate(card.expirationMonth, card.expirationYear)
          )
        )
        .map((card) => ({
          value: card.id,
          label: (
            <div className="flex items-center">
              <CreditCardNetworkLogo network={card.network} /> *{card.lastFour},{' '}
              {card.expirationMonth}/{card.expirationYear}
            </div>
          ),
        }))

      setOptions([
        { value: '', label: t('forms:fields.savedCard.placeholder') },
        ...cardsList,
      ])
      setSavedCards(cards)

      // If there's a default card provided, select card:
      const isDefault = sortedCards.length > 0 && sortedCards[0].default
      const noFormErrors =
        !formErrors || (formErrors && Object.keys(formErrors).length === 0)
      if (isDefault && noFormErrors) {
        const defaultCard = sortedCards[0]
        if (defaultCard) {
          setSelectedCard(defaultCard.id)
          handleSelectedCountryChange(defaultCard.countryCode)
        }
      }
    }

    run()
  }, [t]) /* eslint-disable-line react-hooks/exhaustive-deps */

  return (
    <>
      {getError('expirationDate') ? (
        <AlertMessage
          className={css.notification}
          content={getError('expirationDate')}
          variant="red"
        />
      ) : null}

      <div
        className={clsx(css.formSection, {
          [css.formSectionNoMargin]: selectedCard,
        })}
      >
        <H2>{t('forms:sections.Credit Card')}</H2>

        {options.length > 1 && (
          <SelectField
            error={getError('cardId')}
            name="savedCard"
            className={css.select}
            onChange={(value) => {
              setSelectedCard(value)
              if (value) {
                const countryCode = savedCards.find(
                  (card) => card.id === value
                ).countryCode
                handleSelectedCountryChange(countryCode)
              }
            }}
            label={t('forms:fields.savedCard.label')}
            options={options}
            value={selectedCard}
          />
        )}

        {!selectedCard ? (
          <>
            <FullName
              formErrors={{
                firstName: getError('firstName'),
                lastName: getError('lastName'),
              }}
            />
            <CardDetails getError={getError} />
          </>
        ) : (
          <div>
            <InputField
              className={css.hiddenField}
              name="cardId"
              value={selectedCard}
            />
            <InputField
              error={getError('securityCode')}
              label={t('forms:fields.securityCode.label')}
              maxLength={3}
              name="securityCode"
            />
            <button className={css.differentCardLink} onClick={handleClearCard}>
              {t('forms:fields.differentCardLink.label')}
            </button>
          </div>
        )}

        {!selectedCard && (
          <>
            <Toggle
              id="saveCard"
              name="saveCard"
              checked={shouldSaveCard}
              onChange={(checked) => {
                setDefaultCard(!!checked)
                setShouldSaveCard(checked)
              }}
              label={t('forms:fields.saveCard.label')}
            />
            <div className={css.defaultCardRow}>
              <Toggle
                checked={defaultCard}
                id="default"
                name="default"
                disabled={!shouldSaveCard}
                onChange={(checked) => setDefaultCard(checked)}
                label={t('forms:fields.defaultCard.helpText')}
              />
            </div>
          </>
        )}
      </div>

      {!selectedCard && (
        <BillingAddress
          countries={countries}
          getError={getError}
          handleSelectedCountryChange={handleSelectedCountryChange}
          selectedCountry={selectedCountry}
        />
      )}
    </>
  )
}
