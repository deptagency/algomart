import { MINIMUM_COLLECTIBLE_LISTING_PRICE } from '@algomart/schemas'
import { Translate } from 'next-translate'
import {
  array,
  boolean,
  matches,
  max,
  min,
  number,
  object,
  required,
  string,
} from 'validator-fns'

import { formatCredits } from './currency'

const file = (t: Translate) =>
  object({
    type: string(required(t('forms:errors.required') as string)),
    url: string(required(t('forms:errors.required') as string)),
  })

const files = (t: Translate) => array(file(t))

const edition = (t: Translate) =>
  number(required(t('forms:errors.required') as string))

const assetName = (t: Translate, maxCharacters = 32) =>
  string(
    required(t('forms:errors.required') as string),
    max(maxCharacters, t('forms:errors.maxCharacters') as string)
  )

const description = (t: Translate) =>
  string(required(t('forms:errors.required') as string))

const publish = (t: Translate) =>
  boolean(required(t('forms:errors.required') as string))

const unitName = (t: Translate, maxCharacters = 8) =>
  string(
    required(t('forms:errors.required') as string),
    max(maxCharacters, t('forms:errors.maxCharacters') as string)
  )

const releaseDescription = (t: Translate) =>
  string(required(t('forms:errors.required') as string))

const releaseTitle = (t: Translate) =>
  string(required(t('forms:errors.required') as string))

const releaseSlug = (t: Translate, pattern = /^[\da-z-]{1,32}$/g) =>
  string(
    required(t('forms:errors.required') as string),
    matches(pattern, t('forms:errors.onlyLowercaseLettersAndNumbers') as string)
  )

const packId = (t: Translate) =>
  string(required(t('forms:errors.required') as string))

const price = (t: Translate) =>
  number(required(t('forms:errors.required') as string))

export const validateRevokeAsset = (t: Translate) =>
  object({
    packId: packId(t),
    ownerId: string(required(t('forms:errors.required') as string)),
  })

export const validateExportAsset = (t: Translate) =>
  object({
    address: string(required(t('forms:errors.required') as string)),
    assetIndex: number(required(t('forms:errors.required') as string)),
  })

export const validateInitializeTransferCollectible = (t: Translate) =>
  object({
    address: string(required(t('forms:errors.required') as string)),
    assetIndex: number(required(t('forms:errors.required') as string)),
  })

export const validateTransferCollectible = (t: Translate) =>
  object({
    address: string(required(t('forms:errors.required') as string)),
    assetIndex: number(required(t('forms:errors.required') as string)),
    transactionId: string(required(t('forms:errors.required') as string)),
    signedTransaction: string(required(t('forms:errors.required') as string)),
  })

export const validateCreateAsset = (t: Translate) =>
  object({
    files: files(t),
    editions: edition(t),
    assetName: assetName(t),
    description: description(t),
    price: price(t),
    publish: publish(t),
    unitName: unitName(t),
    releaseDescription: releaseDescription(t),
    releaseTitle: releaseTitle(t),
    releaseSlug: releaseSlug(t),
  })

export const validateTransferAsset = (t: Translate) =>
  object({
    packId: packId(t),
  })

export const validateAddPublicAsset = (t: Translate) =>
  object({
    id: string(required(t('forms:errors.required') as string)),
  })

export const validateShareProfile = (t: Translate) =>
  object({
    shareProfile: boolean(required(t('forms:errors.required') as string)),
  })

export const validateListAssetForSale = (t: Translate) =>
  object({
    id: string(required(t('forms:errors.required') as string)),
    price: number(
      required(t('forms:errors.required') as string),
      min(
        MINIMUM_COLLECTIBLE_LISTING_PRICE,
        t('forms:errors.minListingPriceBalance', {
          min: formatCredits(MINIMUM_COLLECTIBLE_LISTING_PRICE),
        })
      )
    ),
  })
