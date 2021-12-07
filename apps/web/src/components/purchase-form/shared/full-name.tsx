import useTranslation from 'next-translate/useTranslation'

import TextInput from '@/components/text-input/text-input'

export interface FullNameProps {
  formErrors?: {
    fullName?: string
  }
}

export default function FullName({ formErrors }: FullNameProps) {
  const { t } = useTranslation()
  return (
    <TextInput
      error={formErrors?.fullName}
      helpText={t('forms:fields.fullName.helpText')}
      label={t('forms:fields.fullName.label')}
      name="fullName"
      placeholder="Jane Smith"
      variant="small"
    />
  )
}
