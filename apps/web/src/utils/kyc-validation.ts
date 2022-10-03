import { CountryCodePattern } from '@algomart/schemas'
import { Translate } from 'next-translate'
import { exact, matches, object, required, string } from 'validator-fns'

const name = (t: Translate) =>
  string(required(t('forms:errors.required') as string))

const dob = (t: Translate) =>
  string(
    matches(
      /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
      t('forms:errors.invalidDateOfBirth')
    )
  )

// Regex for matching the country code (ISO-3166 alpha-3)
const country = (t: Translate) =>
  string(
    exact(3, t('forms:errors.invalidCountry')),
    matches(CountryCodePattern, t('forms:errors.invalidCountry'))
  )

const state = (t: Translate) =>
  string(
    matches(/^[ a-z]+$/i, t('forms:errors.onlyLetters')),
    exact(2, t('forms:errors.invalidState'))
  )

const emailAddress = (t: Translate) =>
  string(required(t('forms:errors.required') as string))

export const validateCreateApplicant = (t: Translate) =>
  object({
    firstName: name(t),
    lastName: name(t),
    email: emailAddress(t),
    dob: dob(t),
    postcode: string(),
    country: country(t),
    state: state(t),
  })
