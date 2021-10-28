import useTranslation from 'next-translate/useTranslation'

import css from './card-details.module.css'

import TextInput from '@/components/text-input/text-input'

export interface CardDetailsProps {
  formErrors?: {
    fullName?: string
    ccNumber?: string
    expMonth?: string
    expYear?: string
    securityCode?: string
  }
}

export default function CardDetails({ formErrors }: CardDetailsProps) {
  const { t } = useTranslation()
  return (
    <>
      <TextInput
        error={formErrors?.fullName}
        helpText={t('forms:fields.fullName.helpText')}
        label={t('forms:fields.fullName.label')}
        name="fullName"
        placeholder="Jane Smith"
        variant="small"
      />

      <TextInput
        error={formErrors?.ccNumber}
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
              error={formErrors?.expMonth}
              maxLength={2}
              name="expMonth"
              placeholder="MM"
              variant="small"
            />
            <TextInput
              error={formErrors?.expYear}
              maxLength={2}
              name="expYear"
              placeholder="YY"
              variant="small"
            />
          </div>
        </div>
        <div>
          <TextInput
            error={formErrors?.securityCode}
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
