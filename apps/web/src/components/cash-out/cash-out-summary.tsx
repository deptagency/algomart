import Trans from 'next-translate/Trans'
import useTranslation from 'next-translate/useTranslation'

import AppLink from '../app-link/app-link'

import css from './cash-out-summary.module.css'

import Credits from '@/components/currency/credits'
import { useCashOutContext } from '@/contexts/cash-out-context'

export default function CashOutSummary() {
  const { t } = useTranslation()
  const { amountToWithdraw } = useCashOutContext()

  return (
    <div className={css.transactionSummary}>
      <p className={css.summaryHeader}>
        {t('forms:cashOut.Transaction Summary')}
      </p>
      <dl>
        <div className={css.lineItem}>
          <dt>
            <strong>{t('forms:cashOut.Total to be withdrawn')}</strong>
          </dt>
          <dd>
            <strong>
              <Credits parentheses value={amountToWithdraw} />
            </strong>
          </dd>
        </div>
      </dl>
      <div className={css.legalese}>
        <p>
          <Trans
            components={[
              <Credits key={0} parentheses value={amountToWithdraw} />,
            ]}
            i18nKey="forms:cashOut.legalese"
          />
        </p>
      </div>
    </div>
  )
}
