import {
  FirebaseClaim,
  LanguagePattern,
  UserAccountMaxAge,
  UserAccountMinAge,
  UserAccountProvider,
  UserAccountStatus,
  UserAccountUsernamePattern,
} from '@algomart/schemas'
import * as DineroCurrencies from '@dinero.js/currencies'
import { Translate } from 'next-translate'
import {
  boolean,
  email,
  integer,
  matches,
  max,
  min,
  number,
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
    email(t('forms:errors.emailValid') as string)
  )

export const language = (t: Translate) =>
  string(matches(LanguagePattern, t('forms:errors.invalidLanguage')))

export const age = (t: Translate) =>
  number(
    min(UserAccountMinAge, t('forms:errors.invalidAge')),
    max(UserAccountMaxAge, t('forms:errors.invalidAge')),
    integer(t('forms:errors.invalidAge'))
  )

export const provider = (t: Translate) =>
  string(
    required(t('forms:errors.required') as string),
    oneOf([UserAccountProvider.Email], t('forms:errors.invalidProvider'))
  )

export const tos = (t: Translate) =>
  boolean(
    required(t('forms:errors.required') as string),
    oneOf([true], t('forms:errors.acceptTerms'))
  )

export const privacyPolicy = (t: Translate) =>
  boolean(
    required(t('forms:errors.required') as string),
    oneOf([true], t('forms:errors.acceptTerms'))
  )

export const username = (t: Translate) =>
  string(
    required(t('forms:errors.required') as string),
    // important to validate length requirements first since
    // the matches regex also checks for length but will only
    // surface an error mentioning needing letters and numbers
    min(2, t('forms:errors.minCharacters') as string),
    max(20, t('forms:errors.maxCharacters') as string),
    matches(UserAccountUsernamePattern, t('forms:errors.onlyLettersAndNumbers'))
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

export const status = (t: Translate) =>
  string(
    required(t('forms:errors.required') as string),
    oneOf(Object.values(UserAccountStatus), t('forms:errors.invalidStatus'))
  )

// Form Validations
export const validateAge = (t: Translate) => object({ age: age(t) })

export const validateCurrency = (t: Translate) =>
  object({
    currency: currency(t),
  })

export const validateEmailAndPasswordRegistration = (t: Translate) =>
  object({
    currency: currency(t),
    email: emailAddress(t),
    language: language(t),
    username: username(t),
    password: password(t),
    privacyPolicy: privacyPolicy(t),
    tos: tos(t),
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

export const validateSendPasswordReset = (t: Translate) =>
  object({
    email: emailAddress(t),
  })

export const validatePasswordReset = (t: Translate) =>
  object({
    password: password(t),
  })

export const validateUserEmailCreate = (t: Translate) =>
  object({
    currency: currency(t),
    email: emailAddress(t),
    language: language(t),
    provider: provider(t),
    username: username(t),
  })

export const validateNonEmailSetup = (t: Translate) =>
  object({
    currency: currency(t),
    email: emailAddress(t),
    language: language(t),
    username: username(t),
  })

export const validateLanguage = (t: Translate) =>
  object({
    language: language(t),
  })

export const validateLogin = (t: Translate) =>
  object({
    email: emailAddress(t),
    password: password(t),
  })

export const validateUsername = (t: Translate) =>
  object({
    username: username(t),
  })

export const validateStatus = (t: Translate) =>
  object({
    status: status(t),
  })

export const validateSetClaim = (t: Translate) =>
  object({
    userExternalId: userExternalId(t),
    key: role(t),
    value: boolean(),
  })
