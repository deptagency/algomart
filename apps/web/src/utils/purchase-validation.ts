import {
  CountryCodePattern,
  MaxCurrencyAmountInCents,
  MinCircleCreditPaymentAmountInCents,
  PaymentItem,
  PaymentStatus,
  PostalCodePattern,
} from '@algomart/schemas'
import { Translate } from 'next-translate'
import {
  boolean,
  date,
  exact,
  matches,
  max,
  min,
  minDate,
  number,
  object,
  oneOf,
  required,
  string,
} from 'validator-fns'

import { formatCurrency } from '@/utils/currency'

// Maximum bid for card payments as integer
// eslint-disable-next-line unicorn/numeric-separators-style
export const MAX_BID_FOR_CARD_PAYMENT = 300000

const address1 = (t: Translate) =>
  string(
    required(t('forms:errors.required') as string),
    matches(/[\da-z]+/, t('forms:errors.onlyLettersAndNumbers'))
  )

const address2 = (t: Translate) =>
  string(matches(/[\da-z]+/, t('forms:errors.onlyLettersAndNumbers')))

const city = (t: Translate) =>
  string(
    required(t('forms:errors.required') as string),
    matches(/^[ a-z]+$/i, t('forms:errors.onlyLetters'))
  )

// Regex for matching the country code (ISO-3166 alpha-2)
const country = (t: Translate) =>
  string(
    required(t('forms:errors.required') as string),
    exact(2, t('forms:errors.invalidCountry')),
    matches(CountryCodePattern, t('forms:errors.invalidCountry'))
  )

const accountNumber = (t: Translate) =>
  string(
    required(t('forms:errors.required') as string),
    matches(/^\d*$/i, t('forms:errors.onlyNumbers'))
  )

const routingNumber = (t: Translate) =>
  string(
    required(t('forms:errors.required') as string),
    matches(/^\d*$/i, t('forms:errors.onlyNumbers'))
  )

const ccNumber = (t: Translate) =>
  string(
    required(t('forms:errors.required') as string),
    matches(/^\d*$/i, t('forms:errors.onlyNumbers'))
  )

const cvv = (t: Translate) =>
  string(
    required(t('forms:errors.required') as string),
    matches(/^\d{3,4}$/i, t('forms:errors.invalidCVV'))
  )

const expMonth = (t: Translate) =>
  string(
    required(t('forms:errors.required') as string),
    exact(2, t('forms:errors.exactCharacters') as string),
    matches(/^\d*$/i, t('forms:errors.onlyNumbers'))
  )

const expYear = (t: Translate) =>
  string(
    required(t('forms:errors.required') as string),
    exact(2, t('forms:errors.exactCharacters') as string),
    matches(/^\d*$/i, t('forms:errors.onlyNumbers'))
  )

const name = (t: Translate) =>
  string(required(t('forms:errors.required') as string))

const state = (t: Translate, country: string) =>
  country === 'US' || country === 'CA'
    ? string(
        required(t('forms:errors.required') as string),
        exact(2, t('forms:errors.invalidState')),
        matches(/^[a-z]+$/i, t('forms:errors.onlyLetters'))
      )
    : string()

const zipCode = (t: Translate) =>
  string(
    { default: '00000' },
    matches(PostalCodePattern, t('forms:errors.invalidZipCode'))
  )

const keyId = (t: Translate) =>
  string(required(t('forms:errors.required') as string))

const encryptedData = (t: Translate) =>
  string(required(t('forms:errors.required') as string))

const description = (t: Translate) =>
  string(required(t('forms:errors.required') as string))

const identifier = (t: Translate) =>
  string(required(t('forms:errors.required') as string))

const bid = (t: Translate, highestBid: number) => {
  const minimum = highestBid + 1
  return number(
    required(t('forms:errors.required') as string),
    min(highestBid, t('forms:errors.bidLessThanHighestBid')),
    min(
      minimum,
      t('forms:errors.minimumBid', {
        amount: formatCurrency(minimum),
      })
    )
  )
}

const expirationDate = (t: Translate) => {
  return date(minDate(new Date(), t('forms:errors.cardExpiration') as string))
}

export const creditsPurchaseAmount = (t: Translate) =>
  number(
    required(t('forms:errors.required')),
    min(
      MinCircleCreditPaymentAmountInCents,
      t('forms:errors.amountToWithdraw')
    ),
    max(MaxCurrencyAmountInCents, t('forms:errors.amountToWithdraw'))
  )

export const validateBidsForm = (
  t: Translate,
  highestBid: number,
  selectedCountry: string
) =>
  object({
    address1: address1(t),
    bid: bid(t, highestBid),
    ccNumber: ccNumber(t),
    city: city(t),
    country: country(t),
    expMonth: expMonth(t),
    expYear: expYear(t),
    firstName: name(t),
    lastName: name(t),
    securityCode: cvv(t),
    state: state(t, selectedCountry),
    zipCode: zipCode(t),
  })

export const validateBidsFormWithoutCard = (t: Translate, highestBid: number) =>
  object({
    bid: bid(t, highestBid),
    confirmBid: boolean(
      required(t('forms:errors.required') as string),
      oneOf([true], t('forms:errors.mustConfirmBid') as string)
    ),
  })

export const validateBidsFormWithSavedCard = (
  t: Translate,
  highestBid: number
) =>
  object({
    bid: bid(t, highestBid),
    securityCode: cvv(t),
  })

export const validateNewCard = (t: Translate, selectedCountry: string) =>
  object({
    address1: address1(t),
    address2: address2(t),
    ccNumber: ccNumber(t),
    city: city(t),
    country: country(t),
    expMonth: expMonth(t),
    expYear: expYear(t),
    firstName: name(t),
    lastName: name(t),
    securityCode: cvv(t),
    state: state(t, selectedCountry),
    zipCode: zipCode(t),
    default: boolean(),
  })

export const validateSavedCard = (t: Translate) =>
  object({
    cardId: identifier(t),
    securityCode: cvv(t),
  })

export const validateBankAccount = (t: Translate, selectedCountry: string) =>
  object({
    accountNumber: accountNumber(t),
    routingNumber: routingNumber(t),
    firstName: name(t),
    lastName: name(t),
    address1: address1(t),
    address2: address2(t),
    city: city(t),
    country: country(t),
    state: state(t, selectedCountry),
    zipCode: zipCode(t),
    bankName: string(),
    bankAddress1: string(),
    bankAddress2: string(),
    bankCity: string(),
    bankCountry: country(t),
    bankDistrict: string(),
    packTemplateId: string(),
    amount: number(),
  })

export const validatePurchaseCollectibleWithCredits = (t: Translate) =>
  object({
    listingId: identifier(t),
  })

export const validatePurchasePackWithCredits = (t: Translate) =>
  object({
    packTemplateId: identifier(t),
  })

export const validateCreditsPurchaseAmount = (t: Translate) =>
  object({
    amount: creditsPurchaseAmount(t),
  })

export const validateCcPayment = (t: Translate) =>
  object({
    amount: creditsPurchaseAmount(t),
    cardId: identifier(t),
    description: description(t),
    itemId: identifier(t),
    itemType: oneOf(
      [null, ...Object.values(PaymentItem)],
      t('forms:errors.invalidPaymentItemType')
    ),
    verificationKeyId: keyId(t),
    verificationEncryptedData: encryptedData(t),
  })

export const validateUsdcPayment = (t: Translate) =>
  object({
    encodedSignedTransaction: string(
      required(t('forms:errors.required') as string)
    ),
    itemId: identifier(t),
    itemType: oneOf(
      [null, ...Object.values(PaymentItem)],
      t('forms:errors.invalidPaymentItemType')
    ),
  })

export const validatePackCreditsPayment = (t: Translate) =>
  object({
    packTemplateId: identifier(t),
  })

export const validateUpdatePayment = (t: Translate) =>
  object({
    paymentId: identifier(t),
    externalId: string(),
    status: oneOf(
      Object.values(PaymentStatus),
      t('forms:errors.invalidPayment') as string
    ),
  })

export const validateRemoveCard = (t: Translate) =>
  object({
    cardId: identifier(t),
  })

export const validateExpirationDate = (t: Translate) =>
  object({
    expirationDate: expirationDate(t),
  })
