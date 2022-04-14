import useTranslation from 'next-translate/useTranslation'

import DefaultLayout from '@/layouts/default-layout'
import VerificationTemplate from '@/templates/kyc-verification-template'

export default function VerifyPage() {
  const { t } = useTranslation()

  return (
    <DefaultLayout
      pageTitle={t('common:pageTitles.My Verification')}
      panelPadding
    >
      <VerificationTemplate />
    </DefaultLayout>
  )
}
