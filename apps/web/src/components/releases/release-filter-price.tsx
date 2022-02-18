import { DEFAULT_CURRENCY } from '@algomart/schemas'
import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'
import { useEffect, useState } from 'react'

import css from './release-filter.module.css'

import Button from '@/components/button'
import CurrencyInput, {
  CurrencyInputProps,
} from '@/components/currency-input/currency-input'
import Heading from '@/components/heading'
import { useI18n } from '@/contexts/i18n-context'
import { usePackFilterContext } from '@/contexts/pack-filter-context'
import { useCurrency } from '@/hooks/use-currency'
import { useLocale } from '@/hooks/use-locale'
import { packFilterActions } from '@/hooks/use-pack-filter'
import { formatFloatToInt, formatIntToFloat } from '@/utils/format-currency'

export default function ReleaseFilterPrice() {
  const locale = useLocale()
  const currency = useCurrency()
  const { t } = useTranslation()
  const { dispatch, state } = usePackFilterContext()
  const [priceLow, setPriceLow] = useState<string>(
    formatIntToFloat(state.priceLow, currency)
  )
  const [priceHigh, setPriceHigh] = useState<string>(
    formatIntToFloat(state.priceHigh, currency)
  )

  const baseCurrencyInputProps: CurrencyInputProps = {
    decimalsLimit: 2,
    intlConfig: { locale, currency },
    placeholder: 'Please enter a number',
    step: 1,
    variant: 'small',
  }

  return (
    <div className={css.root}>
      <div className={clsx(css.filterRow, css.filterHeader)}>
        <Heading level={2}>{t('release:filters.Price Range')}</Heading>
        <div className={css.badge}>{currency}</div>
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
              const low = formatFloatToInt(priceLow, currency)
              const high = formatFloatToInt(priceHigh, currency)
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
