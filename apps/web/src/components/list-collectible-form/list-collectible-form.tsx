import {
  CollectibleListingType,
  CollectibleWithDetails,
  MINIMUM_COLLECTIBLE_LISTING_PRICE,
} from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useState } from 'react'

import css from './list-collectible-form.module.css'

import Button from '@/components/button'
import CurrencyInput from '@/components/currency-input/currency-input'
import RadioGroupField from '@/components/radio-group-field'
import { validateListAssetForSale } from '@/utils/asset-validation'

interface IFormErrors {
  price: string
}
interface IListCollectibleForm {
  collectible: CollectibleWithDetails
  onSubmit: ({ price }: { price: number }) => unknown
}
export default function ListCollectibleForm({
  collectible,
  onSubmit,
}: IListCollectibleForm) {
  const { t } = useTranslation()

  const typeOfSaleOptionsMap = {
    fixedPrice: {
      label: t('forms:fields.typeOfSale.options.fixedPrice.label'),
      value: CollectibleListingType.FixedPrice,
    },
    auction: {
      label: t('forms:fields.typeOfSale.options.auction.label'),
      value: CollectibleListingType.Auction,
      disabled: true,
    },
  }

  const typeOfSaleOptionsInOrder = [
    typeOfSaleOptionsMap.fixedPrice,
    typeOfSaleOptionsMap.auction,
  ]

  // TODO: Add support for secondary auctions
  const [typeOfSale] = useState(typeOfSaleOptionsMap.fixedPrice.value)

  const [errors, setErrors] = useState({
    price: null,
  })

  // CurrencyInput deals with whole numbers only, 500 === $5.00
  const [price, setPrice] = useState(MINIMUM_COLLECTIBLE_LISTING_PRICE)

  // TODO: do these need to be localized?
  // service fee temporarily  removed
  // const serviceFee = '2.5%'
  const royaltyFee = '5%'

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const handleTypeOfSaleChange = useCallback(() => {}, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // we validate using the same schema that the nextJS API will use to validate our request body.
    // the next JS endpoint takes price as an int though (x100), so we override the min price in
    // our validation here and also divide the value we're passing in so that if an error is generated,
    // it's displayed as e.g. 5.00 instead of 500
    const validation = await validateListAssetForSale(t)({
      id: collectible.id,
      price: price,
    })
    if (validation.isValid) {
      onSubmit({ price })
    } else {
      // unsure why but TS yells that errors is not a property of validation even though it is, so manually
      // specifying errors type here
      setErrors((validation as unknown as { errors: IFormErrors }).errors)
    }
  }

  return (
    <form className={css.listCollectibleForSaleForm} onSubmit={handleSubmit}>
      <RadioGroupField
        name="typeOfSale"
        label={t('forms:fields.typeOfSale.label')}
        value={typeOfSale}
        options={typeOfSaleOptionsInOrder}
        onChange={handleTypeOfSaleChange}
      />
      <CurrencyInput
        error={errors.price}
        onChange={setPrice}
        label={t('forms:fields.price.label')}
        value={price}
        allowNegativeValue={false}
        min={MINIMUM_COLLECTIBLE_LISTING_PRICE}
      />

      <dl className={css.feeSummary}>
        <div className={css.lineItem}>
          <dt>{t('nft:sell.royaltyFee')}</dt>
          <dd>
            <strong>{royaltyFee}</strong>
          </dd>
        </div>
      </dl>

      <Button
        data-e2e="list-for-secondary-marketplace-sale"
        fullWidth
        size="large"
        type="submit"
      >
        {t('nft:sell.listForSale')}
      </Button>
    </form>
  )
}
