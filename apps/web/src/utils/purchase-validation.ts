import { Translate } from 'next-translate'
import {
  boolean,
  date,
  exact,
  matches,
  min,
  minDate,
  number,
  object,
  required,
  string,
} from 'validator-fns'

import { formatCurrency } from '@/utils/format-currency'

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
    matches(/^[ a-z]+$/i, t('forms:errors.onlyLetters')),
    exact(2, t('forms:errors.invalidCountry')),
    matches(
      new RegExp(
        '/^A[^ABCHJKNPVY]|B[^CKPUX]|C[^BEJPQST]|D[EJKMOZ]|E[CEGHRST]|F[IJKMOR]|G[^CJKOVXZ]|H[KMNRTU]|I[DEL-OQ-T]|J[EMOP]|K[EGHIMNPRWYZ]|L[ABCIKR-VY]|M[^BIJ]|N[ACEFGILOPRUZ]|OM|P[AE-HK-NRSTWY]|QA|R[EOSUW]|S[^FPQUW]|T[^ABEIPQSUXY]|U[AGMSYZ]|V[ACEGINU]|WF|WS|YE|YT|Z[AMW]$/ix'
      ),
      t('forms:errors.invalidCountry')
    )
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

const fullName = (t: Translate) =>
  string(required(t('forms:errors.required') as string))

const state = (t: Translate) =>
  string(
    required(t('forms:errors.required') as string),
    exact(2, t('forms:errors.invalidState')),
    matches(/^[a-z]+$/i, t('forms:errors.onlyLetters'))
  )

const zipCode = (t: Translate) =>
  string(
    required(t('forms:errors.required') as string),
    matches(/^\d{5}$/, t('forms:errors.invalidZipCode'))
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

export const validateBidsForm = (t: Translate, highestBid: number) =>
  object({
    address1: address1(t),
    bid: bid(t, highestBid),
    ccNumber: ccNumber(t),
    city: city(t),
    country: country(t),
    expMonth: expMonth(t),
    expYear: expYear(t),
    fullName: fullName(t),
    securityCode: cvv(t),
    state: state(t),
    zipCode: zipCode(t),
  })

export const validateBidsFormWithSavedCard = (
  t: Translate,
  highestBid: number
) =>
  object({
    bid: bid(t, highestBid),
    securityCode: cvv(t),
  })

export const validatePurchaseForm = (t: Translate) =>
  object({
    address1: address1(t),
    ccNumber: ccNumber(t),
    city: city(t),
    country: country(t),
    expMonth: expMonth(t),
    expYear: expYear(t),
    fullName: fullName(t),
    securityCode: cvv(t),
    state: state(t),
    zipCode: zipCode(t),
  })

export const validatePurchaseFormWithSavedCard = (t: Translate) =>
  object({
    securityCode: cvv(t),
  })

export const validateCard = (t: Translate) =>
  object({
    keyId: keyId(t),
    encryptedData: encryptedData(t),
    fullName: fullName(t),
    address1: address1(t),
    address2: address2(t),
    city: city(t),
    country: country(t),
    expMonth: expMonth(t),
    expYear: expYear(t),
    state: state(t),
    zipCode: zipCode(t),
    saveCard: boolean(),
    default: boolean(),
  })

export const validatePurchase = (t: Translate) =>
  object({
    verificationKeyId: keyId(t),
    description: description(t),
    cardId: identifier(t),
    verificationEncryptedData: encryptedData(t),
    packTemplateId: identifier(t),
  })

export const validateUpdateCard = (t: Translate) =>
  object({
    cardId: identifier(t),
    default: boolean(),
  })

export const validateRemoveCard = (t: Translate) =>
  object({
    cardId: identifier(t),
  })

export const validateExpirationDate = (t: Translate) =>
  object({
    expirationDate: expirationDate(t),
  })
