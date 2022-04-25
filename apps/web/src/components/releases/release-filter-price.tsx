import { DEFAULT_CURRENCY } from '@algomart/schemas'
import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'
import { useState } from 'react'

import css from './release-filter.module.css'

import Button from '@/components/button'
import CurrencyInput from '@/components/currency-input/currency-input'
import Heading from '@/components/heading'
import { usePackFilterContext } from '@/contexts/product-filter-context'
import { productFilterActions } from '@/hooks/use-product-filter'

export default function ReleaseFilterPrice() {
  const { t } = useTranslation()
  const { dispatch, state } = usePackFilterContext()
  const [priceLow, setPriceLow] = useState(state.priceLow)
  const [priceHigh, setPriceHigh] = useState(state.priceHigh)

  const handleApplyPriceRange = () => {
    dispatch(productFilterActions.setPrice({ priceLow, priceHigh }))
  }

  const isRangeApplied =
    priceLow === state.priceLow && priceHigh === state.priceHigh
  const isValidRange = priceLow < priceHigh

  return (
    <div className={css.root}>
      <div className={clsx(css.filterRow, css.filterHeader)}>
        <Heading level={2}>{t('release:filters.Price Range')}</Heading>
        <div className={css.badge}>{DEFAULT_CURRENCY}</div>
      </div>
      <div className={css.filterRow}>
        <div className={css.filterItem}>
          <CurrencyInput
            onChange={(value) => setPriceLow(value)}
            label={t('release:filters.Low')}
            value={priceLow}
            variant="small"
          />
        </div>
        <div className={css.filterItem}>
          <CurrencyInput
            onChange={(value) => setPriceHigh(value)}
            label={t('release:filters.High')}
            min={priceLow}
            value={priceHigh}
            variant="small"
          />
        </div>
        <div className={css.filterItem}>
          <Button
            disabled={!isValidRange || isRangeApplied}
            fullWidth
            onClick={handleApplyPriceRange}
            size="small"
          >
            {t('common:actions.Apply')}
          </Button>
        </div>
      </div>
    </div>
  )
}
