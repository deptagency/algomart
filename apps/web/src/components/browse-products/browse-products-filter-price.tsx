import useTranslation from 'next-translate/useTranslation'
import { useEffect, useState } from 'react'

import css from './browse-products-filters.module.css'

import Button from '@/components/button'
import CurrencyInput from '@/components/currency-input/currency-input'
import { H2 } from '@/components/heading'
import { usePackFilter } from '@/hooks/use-pack-filter'

export default function BrowseProductsFilterPrice() {
  const { t } = useTranslation()
  const filter = usePackFilter()
  const [priceLow, setPriceLow] = useState(filter.priceLow)
  const [priceHigh, setPriceHigh] = useState(filter.priceHigh)

  useEffect(() => {
    if (priceLow !== filter.priceLow) {
      setPriceLow(filter.priceLow)
    }
    if (priceHigh !== filter.priceHigh) {
      setPriceHigh(filter.priceHigh)
    }
  }, [filter.priceLow, filter.priceHigh]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplyPriceRange = () => {
    filter.updateState({ priceLow, priceHigh })
  }

  const isRangeApplied =
    priceLow === filter.priceLow && priceHigh === filter.priceHigh
  const isValidRange = priceLow < priceHigh

  return (
    <div className={css.root}>
      <div className={css.filterHeader}>
        <H2 size={4}>{t('drops:filters.Price Range')}</H2>
      </div>
      <div className={css.filterRow}>
        <CurrencyInput
          label={t('drops:filters.Low')}
          onChange={(value) => setPriceLow(value)}
          value={priceLow}
          density="compact"
        />
        <CurrencyInput
          label={t('drops:filters.High')}
          min={priceLow}
          onChange={(value) => setPriceHigh(value)}
          value={priceHigh}
          density="compact"
        />
        <div className={css.filterItem}>
          <Button
            disabled={!isValidRange || isRangeApplied}
            fullWidth
            onClick={handleApplyPriceRange}
            variant="primary"
          >
            {t('common:actions.Apply')}
          </Button>
        </div>
      </div>
    </div>
  )
}
