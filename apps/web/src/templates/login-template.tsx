import useTranslation from 'next-translate/useTranslation'

import Heading from '@/components/heading'
import Loading from '@/components/loading/loading'
import LoginPanel from '@/components/login-panel/login-panel'
import { PackAndRedeemCode } from '@/contexts/redemption-context'
import { AuthState } from '@/types/auth'

export interface LoginTemplateProps {
  handleLoginEmail(): void
  handleLoginGoogle(): Promise<void>
  handleRedeemEdition(): void
  isRegistered: boolean
  redeemable: PackAndRedeemCode | null
  status: AuthState['status']
}

export default function LoginTemplate({
  handleLoginEmail,
  handleLoginGoogle,
  handleRedeemEdition,
  isRegistered,
  redeemable,
  status,
}: LoginTemplateProps) {
  const { t } = useTranslation()

  const showLoading =
    status === 'loading' || (status === 'authenticated' && !isRegistered)

  return showLoading ? (
    <div className="text-center">
      <Loading loadingText={t('common:statuses.Loading')} variant="secondary" />
    </div>
  ) : (
    <>
      <Heading className="px-4 mb-4 text-center">
        {t('auth:contentTitle')}
      </Heading>
      {redeemable && (
        <p className="px-4 mb-12 text-center">
          {t('auth:contentBody', { name: redeemable.pack.title })}
        </p>
      )}
      <LoginPanel
        handleLoginEmail={handleLoginEmail}
        handleLoginGoogle={handleLoginGoogle}
        handleRedeemEdition={handleRedeemEdition}
        isAuthenticated={status === 'authenticated'}
        redemptionData={redeemable}
      />
    </>
  )
}
