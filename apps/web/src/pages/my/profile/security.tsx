import useTranslation from 'next-translate/useTranslation'

import MyProfileLayout from '@/layouts/my-profile-layout'
import MyProfileSecurityTemplate from '@/templates/my-profile-security-template'

export default function MyProfileSecurityPage() {
  const { t } = useTranslation()

  return (
    <MyProfileLayout pageTitle={t('common:pageTitles.Security')}>
      <MyProfileSecurityTemplate />
    </MyProfileLayout>
  )
}
