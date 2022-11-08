import { AuthErrorCodes } from 'firebase/auth'
import useTranslation from 'next-translate/useTranslation'

import css from './login-template.module.css'

import AlertMessage from '@/components/alert-message/alert-message'
import Dialog from '@/components/dialog/dialog'
import { H1 } from '@/components/heading'
import Loading from '@/components/loading/loading'
import LoginPanel from '@/components/login-panel/login-panel'
import { PackAndRedeemCode } from '@/contexts/redemption-context'

export interface LoginTemplateProps {
  handleRedeemEdition(): void
  handleLoginGoogle(): void
  error: string
  isAuthenticated: boolean
  loading: boolean
  redeemable: PackAndRedeemCode | null
}

export default function LoginTemplate({
  handleRedeemEdition,
  handleLoginGoogle,
  isAuthenticated,
  error,
  loading,
  redeemable,
}: LoginTemplateProps) {
  const { t } = useTranslation()

  return (
    <div className="mb-24">
      {loading && (
        <Dialog
          contentClassName={css.dialog}
          overlayClassName={css.overlay}
          onClose={() => null}
          open={loading}
        >
          <div className={css.root}>
            <Loading />
          </div>
        </Dialog>
      )}
      {error && (
        <AlertMessage
          variant="red"
          content={
            error.includes(AuthErrorCodes.EMAIL_EXISTS)
              ? t('forms:errors.emailAlreadyInUseAfterSubmit')
              : t('common:statuses.An Error has Occurred')
          }
        />
      )}
      <H1 center uppercase className="px-4 pt-12">
        {t('auth:contentTitle')}
      </H1>
      {redeemable && (
        <p className="px-4 text-center">
          {t('auth:contentBody', { name: redeemable.pack.title })}
        </p>
      )}
      <LoginPanel
        handleRedeemEdition={handleRedeemEdition}
        handleLoginGoogle={handleLoginGoogle}
        isAuthenticated={isAuthenticated}
        redemptionData={redeemable}
      />
    </div>
  )
}
