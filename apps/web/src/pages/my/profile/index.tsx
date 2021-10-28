import useTranslation from 'next-translate/useTranslation'

import MyProfileLayout from '@/layouts/my-profile-layout'
import MyProfileTemplate from '@/templates/my-profile-template'

export default function MyProfilePage() {
  const { t } = useTranslation()

  return (
    <MyProfileLayout pageTitle={t('common:pageTitles.My Profile')}>
      <MyProfileTemplate />
    </MyProfileLayout>
  )
}
