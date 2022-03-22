import { DEFAULT_LOCALE } from '@algomart/schemas'
import { convert, Currency, dinero, Rates } from 'dinero.js'
import { useMemo } from 'react'
import useSWR from 'swr'

import { ALGO } from '@/utils/format-currency'

const getSpotPriceURL = (currency: string) =>
  `https://api.coinbase.com/v2/prices/ALGO-${currency}/spot`

const DEFAULT_SCALE = 6

const SPOT_PRICE_REFRESH_INTERVAL = 120_000

interface SpotPriceResponse {
  data: {
    amount: string
    base: string
    currency: string
  }
}

export function toDineroRates(
  spotPrice: SpotPriceResponse,
  scale: number
): Rates<number> {
  return {
    [spotPrice.data.currency]: {
      amount: Math.floor(Number(spotPrice.data.amount) * 10 ** scale),
      scale,
    },
  }
}

export function useConvertFromALGO(
  amount: number,
  targetCurrency: Currency<number>,
  ratesScale = DEFAULT_SCALE,
  locale = DEFAULT_LOCALE
) {
  const { data } = useSWR<SpotPriceResponse>(
    getSpotPriceURL(targetCurrency.code),
    {
      refreshInterval: SPOT_PRICE_REFRESH_INTERVAL,
    }
  )

  const rates = useMemo(() => {
    if (!data) return null
    return toDineroRates(data, ratesScale)
  }, [data, ratesScale])

  return useMemo(() => {
    if (!rates) return null
    return convert(dinero({ amount, currency: ALGO }), targetCurrency, rates)
  }, [amount, rates, targetCurrency])
}
