
import { Currency } from '@/components/auth-inputs/auth-inputs'
import { useCurrency } from '@/contexts/currency-context'

export default function AppFooterCurrency() {
  const { currency, setCurrency } = useCurrency()
  return <Currency showLabel={false} value={currency} onChange={setCurrency} />
}
