import { DEFAULT_CURRENCY } from '@algomart/schemas'
import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'

import Currency from './currency'

import Tooltip from '@/components/tooltip'
import { useCurrency } from '@/contexts/currency-context'
import { formatCredits } from '@/utils/currency'

interface ICredits {
  value: number
  parentheses?: boolean
  prefix?: string
  localClassName?: string
}

/**
 * Given a value in credits, renders value with credits label
 */
export default function Credits({
  value,
  prefix,
  parentheses = false,
  localClassName,
}: ICredits) {
  const { t } = useTranslation()
  const { currency } = useCurrency()
  const absValue = Math.abs(value)

  return (
    <>
      {prefix && <span>{prefix} </span>}
      {formatCredits(value)}
      {currency !== DEFAULT_CURRENCY ? (
        <span className={clsx('font-normal', localClassName)}>
          {' '}
          {parentheses && '('}
          <Currency value={absValue} />
          <Tooltip
            iconClassName="opacity-80 ml-1 -translate-y-px"
            content={t('common:tips.currencyEstimate')}
            position="bottom"
          />
          {parentheses && ')'}
        </span>
      ) : null}
    </>
  )
}
