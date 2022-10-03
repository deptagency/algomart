import useTranslation from 'next-translate/useTranslation'
import { useCallback, useState } from 'react'

import { MyProfilePersonalSettingsSectionProps } from './my-profile-personal-settings'

import css from './my-profile-personal-settings.module.css'

import { Age } from '@/components/auth-inputs/auth-inputs'
import { useAuth } from '@/contexts/auth-context'
import { AuthService } from '@/services/auth-service'
import { validateAge } from '@/utils/auth-validation'

export default function MyProfileAge({
  onUpdateSuccess,
  onError,
}: MyProfilePersonalSettingsSectionProps) {
  const { reloadProfile, user } = useAuth()
  const [age, setAge] = useState(user.age)
  const [loading, setLoading] = useState<boolean>(false)
  const { t } = useTranslation()
  const handleUpdateAge = useCallback(
    async (newAge: string) => {
      if (newAge === '') return

      const result = await validateAge(t)({ age: Number.parseInt(newAge, 10) })

      if (result.state === 'invalid') {
        onError(result.errors.age as string)
        onUpdateSuccess('')
        return
      }

      setLoading(true)
      onError('')
      onUpdateSuccess('')

      // Update age
      const updateAge = await AuthService.instance.updateAge(result.value.age)
      if (!updateAge) {
        onError(t('common:statuses.An Error has Occurred'))
        setLoading(false)
        return
      }

      await reloadProfile()
      setLoading(false)
      onError('')
      setAge(result.value.age)
      onUpdateSuccess(t('profile:resetAgeConfirmation'))
      return
    },
    [reloadProfile, t, onError, onUpdateSuccess]
  )

  return (
    <div className={css.inputWrapper}>
      <Age
        noMargin
        disabled={loading}
        label=""
        value={typeof age === 'number' ? String(age) : ''}
        onChange={(age) => handleUpdateAge(age)}
      />
      {t('profile:Age')}
    </div>
  )
}
