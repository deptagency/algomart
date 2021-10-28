import { DEFAULT_CURRENCY } from '@algomart/schemas'
import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'
import { useState } from 'react'

import css from './release-filter.module.css'

import Button from '@/components/button'
import CurrencyInput, {
  CurrencyInputProps,
} from '@/components/currency-input/currency-input'
import Heading from '@/components/heading'
import { usePackFilterContext } from '@/contexts/pack-filter-context'
import { useLocale } from '@/hooks/useLocale'
import { packFilterActions } from '@/hooks/usePackFilter'
import { formatFloatToInt, formatIntToFloat } from '@/utils/format-currency'

export default function ReleaseFilterPrice() {
  const locale = useLocale()
  const { t } = useTranslation()
  const { dispatch, state } = usePackFilterContext()
  const [priceLow, setPriceLow] = useState<string>(
    formatIntToFloat(state.priceLow)
  )
  const [priceHigh, setPriceHigh] = useState<string>(
    formatIntToFloat(state.priceHigh)
  )

  const baseCurrencyInputProps: CurrencyInputProps = {
    decimalsLimit: 2,
    intlConfig: { locale, currency: DEFAULT_CURRENCY },
    placeholder: 'Please enter a number',
    step: 1,
    variant: 'small',
  }

  return (
    <div className={css.root}>
      <div className={clsx(css.filterRow, css.filterHeader)}>
        <Heading level={2}>{t('release:filters.Price Range')}</Heading>
        <div className={css.badge}>{DEFAULT_CURRENCY}</div>
      </div>
      <div className={css.filterRow}>
        <div className={css.filterItem}>
          <CurrencyInput
            {...baseCurrencyInputProps}
            handleChange={(value) => setPriceLow(value)}
            id="low"
            min={0}
            label={t('release:filters.Low')}
            name="low"
            value={priceLow}
          />
        </div>
        <div className={css.filterItem}>
          <CurrencyInput
            {...baseCurrencyInputProps}
            handleChange={(value) => setPriceHigh(value)}
            id="high"
            label={t('release:filters.High')}
            min={1}
            name="high"
            value={priceHigh}
          />
        </div>
        <div className={css.filterItem}>
          <Button
            disabled={
              Number(priceLow) >= Number(priceHigh) ||
              Number(priceHigh) <= Number(priceLow)
            }
            fullWidth
            onClick={() => {
              const low = formatFloatToInt(priceLow)
              const high = formatFloatToInt(priceHigh)
              dispatch(
                packFilterActions.setPrice({ priceLow: low, priceHigh: high })
              )
            }}
            size="small"
          >
            {t('common:actions.Apply')}
          </Button>
        </div>
      </div>
    </div>
  )
}
