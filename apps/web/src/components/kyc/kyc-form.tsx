import Trans from 'next-translate/Trans'
import useTranslation from 'next-translate/useTranslation'

import AppLink from '../app-link/app-link'

import css from './kyc-form.module.css'

import Button from '@/components/button'
import { Form } from '@/components/form'
import InputField from '@/components/input-field'
import { useKYCContext } from '@/contexts/kyc-context'

export interface KYCFormProps {
  formClassName?: string
  handleSubmit: (data: { firstName: string; lastName: string }) => Promise<void>
}

export default function KYCForm({ formClassName, handleSubmit }: KYCFormProps) {
  const { t } = useTranslation()
  const { applicant } = useKYCContext()

  return (
    <>
      <p className={css.message}>
        <span className={css.helpText}>
          {t('forms:fields.customerVerification.helpTextStart.1')}
        </span>
      </p>
      <p className={css.message}>
        <span>{t('forms:fields.customerVerification.helpTextStart.2')}</span>
      </p>
      <p className={css.messageLink}>
        <Trans
          components={[
            <AppLink
              key="0"
              className="underline"
              target="_blank"
              href="/aml-policy"
            />,
          ]}
          i18nKey="forms:fields.customerVerification.cta"
        />
      </p>
      <Form
        className={formClassName}
        onSubmit={handleSubmit}
        initialValues={{
          firstName: applicant?.firstName,
          lastName: applicant?.lastName,
        }}
      >
        {({ errors, values }) => (
          <>
            <div className={css.formMultiRow}>
              <InputField
                error={errors.firstName}
                label={t('forms:fields.firstName.label')}
                name="firstName"
                placeholder="Jane"
                defaultValue={applicant?.firstName}
              />
              <InputField
                error={errors.lastName}
                label={t('forms:fields.lastName.label')}
                name="lastName"
                placeholder="Smith"
                defaultValue={applicant?.lastName}
              />
            </div>
            <div className={css.buttonGroup}>
              <Button type="submit">{t('forms:Submit')}</Button>
            </div>
          </>
        )}
      </Form>
    </>
  )
}
