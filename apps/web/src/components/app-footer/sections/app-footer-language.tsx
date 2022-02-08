import { DEFAULT_LOCALE } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import React, { useCallback, useMemo, useState } from 'react'

import { Language } from '../../auth-inputs/auth-inputs'
import { SelectOption } from '../../select/select'

import { useAuth } from '@/contexts/auth-context'
import authService from '@/services/auth-service'
import { validateLanguage } from '@/utils/auth-validation'

export default function AppFooterLanguage() {
  const { t } = useTranslation()
  const { user, reloadProfile } = useAuth()
  const [language, setLanguage] = useState<string>(
    user?.locale || DEFAULT_LOCALE
  )

  const validate = useMemo(() => validateLanguage(t), [t])

  const handleLanguageChange = useCallback(
    async (selectedOption: SelectOption) => {
      // setLoading(true)
      // setUpdateError('')
      // setUpdateSuccess(false)

      // Validate form body
      const body = {
        language: selectedOption.id,
      }
      const bodyValidation = await validate(body)
      if (bodyValidation.state === 'invalid') {
        // setFormErrors(bodyValidation.errors)
        // setLoading(false)
        return
      }

      // Update language
      const updateLanguage = await authService.updateLanguage(body.language)
      if (!updateLanguage) {
        // setUpdateError(t('common:statuses.An Error has Occurred'))
        // setLoading(false)
        return
      }
      // setLoading(false)
      // setIsEditing(false)
      // setFormErrors({})
      // setUpdateError('')
      // setUpdateSuccess(true)
      setLanguage(selectedOption.id)
      return
    },
    [validate]
  )

  return (
    <Language
      showLabel={false}
      value={language}
      handleChange={handleLanguageChange}
      t={t}
    />
  )
}
