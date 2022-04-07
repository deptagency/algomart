import useTranslation from 'next-translate/useTranslation'

import css from './card-details.module.css'

import TextInput from '@/components/text-input/text-input'
import { usePaymentContext } from '@/contexts/payment-context'

export default function CardDetails() {
  const { t } = useTranslation()
  const { getError } = usePaymentContext()
  return (
    <>
      <TextInput
        error={getError('ccNumber')}
        label={t('forms:fields.ccNumber.label')}
        maxLength={20}
        name="ccNumber"
        variant="small"
      />

      <div className={css.formMultiRow}>
        <div>
          <label htmlFor="expMonth">
            {t('forms:fields.expirationDate.label')}
          </label>
          <div className={css.formMultiRow}>
            <TextInput
              error={getError('expMonth')}
              maxLength={2}
              name="expMonth"
              placeholder="MM"
              variant="small"
            />
            <TextInput
              error={getError('expYear')}
              maxLength={2}
              name="expYear"
              placeholder="YY"
              variant="small"
            />
          </div>
        </div>
        <div>
          <TextInput
            error={getError('securityCode')}
            label={t('forms:fields.securityCode.label')}
            maxLength={3}
            name="securityCode"
            placeholder="123"
            variant="small"
          />
        </div>
      </div>
    </>
  )
}
