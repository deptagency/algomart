import useTranslation from 'next-translate/useTranslation'

import InputField from '@/components/input-field'

export interface FullNameProps {
  formErrors?: {
    firstName?: string
    lastName?: string
  }
}

export default function FullName({ formErrors }: FullNameProps) {
  const { t } = useTranslation()
  return (
    <>
      <InputField
        error={formErrors?.firstName}
        helpText={t('forms:fields.fullName.helpText')}
        label={t('forms:fields.firstName.label')}
        name="firstName"
        placeholder="Jane"
      />
      <InputField
        error={formErrors?.lastName}
        label={t('forms:fields.lastName.label')}
        name="lastName"
        placeholder="Smith"
      />
    </>
  )
}
