import { FirebaseClaim } from '@algomart/schemas'
import * as DineroCurrencies from '@dinero.js/currencies'
import { Translate } from 'next-translate'
import {
  boolean,
  email,
  exact,
  matches,
  min,
  object,
  oneOf,
  required,
  string,
} from 'validator-fns'

// Fields
export const currency = (t: Translate) =>
  string(
    required(t('forms:errors.required') as string),
    oneOf(
      Object.keys(DineroCurrencies),
      t('forms:errors.invalidCurrency') as string
    )
  )

export const emailAddress = (t: Translate) =>
  string(
    required(t('forms:errors.required') as string),
    min(8, t('forms:errors.minCharacters') as string),
    email(t('forms:errors.emailValid') as string)
  )

export const language = () => string()

export const username = (t: Translate) =>
  string(
    required(t('forms:errors.required') as string),
    matches(/[\da-z]+/, t('forms:errors.onlyLettersAndNumbers')),
    min(8, t('forms:errors.minCharacters') as string)
  )
export const passphrase = (t: Translate) =>
  string(
    required(t('forms:errors.required') as string),
    exact(6, t('forms:errors.exactCharacters') as string)
  )
export const password = (t: Translate) =>
  string(
    required(t('forms:errors.required') as string),
    min(8, t('forms:errors.minCharacters') as string)
  )
export const role = (t: Translate) =>
  string(
    required(t('forms:errors.required') as string),
    oneOf(Object.keys(FirebaseClaim), t('forms:errors.invalidClaim') as string)
  )

export const userExternalId = (t: Translate) =>
  string(required(t('forms:errors.required') as string))

// Form Validations
export const validateCurrency = (t: Translate) =>
  object({
    currency: currency(t),
  })

export const validateEmailAndPasswordRegistration = (t: Translate) =>
  object({
    currency: currency(t),
    email: emailAddress(t),
    language: language(),
    username: username(t),
    password: password(t),
    passphrase: passphrase(t),
  })

export const validateEmail = (t: Translate) =>
  object({
    email: emailAddress(t),
  })

export const validateEmailUpdate = (t: Translate) =>
  object({
    password: password(t),
    email: emailAddress(t),
    emailConfirm: emailAddress(t),
  })

export const validatePasswordReset = (t: Translate) =>
  object({
    email: emailAddress(t),
  })

export const validateUserRegistration = (t: Translate) =>
  object({
    currency: currency(t),
    email: username(t),
    language: language(),
    username: username(t),
    passphrase: passphrase(t),
  })
//
export const validateLanguage = () =>
  object({
    language: language(),
  })

export const validateLogin = (t: Translate) =>
  object({
    email: emailAddress(t),
    password: password(t),
  })

export const validatePassphrase = (t: Translate) =>
  object({
    passphrase: passphrase(t),
  })

export const validateUsername = (t: Translate) =>
  object({
    username: username(t),
  })

export const validateSetClaim = (t: Translate) =>
  object({
    userExternalId: userExternalId(t),
    key: role(t),
    value: boolean(),
  })
