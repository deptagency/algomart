import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'

import LinkButton from '../link-button'

import css from './login-panel.module.css'

import AppLink from '@/components/app-link/app-link'
import Button from '@/components/button'
import { PackAndRedeemCode } from '@/contexts/redemption-context'
import { urls } from '@/utils/urls'

const googleIcon = '/images/logos/google.svg'

interface LoginPanelProps {
  handleRedeemEdition(): void
  handleLoginGoogle(): void
  isAuthenticated: boolean
  redemptionData: PackAndRedeemCode | null
}

export default function LoginPanel({
  handleRedeemEdition,
  handleLoginGoogle,
  isAuthenticated,
  redemptionData,
}: LoginPanelProps) {
  const { t } = useTranslation()
  return (
    <section className={css.root}>
      <div className={css.buttonContainer}>
        {/* Claim button, present when redeeming */}
        {isAuthenticated && redemptionData && (
          <Button
            className={css.button}
            size="large"
            onClick={handleRedeemEdition}
          >
            {t('common:actions.Claim My Edition')}
          </Button>
        )}

        {/* Login buttons */}
        {!isAuthenticated && (
          <>
            <LinkButton
              className={css.button}
              data-e2e="sign-in-with-email"
              href={urls.loginEmail}
              size="large"
              variant="secondary"
            >
              {t('auth:Sign In with Email')}
            </LinkButton>
            <Button
              className={css.buttonGoogle}
              onClick={handleLoginGoogle}
              variant="secondary"
              size="large"
            >
              <Image
                width={36}
                height={36}
                alt={t('auth:Google logo')}
                src={googleIcon}
              />
              <p className={css.buttonImageText}>
                {t('auth:Sign In with Google')}
              </p>
            </Button>
            <div className={css.signupPrompt}>
              <AppLink
                data-e2e="create-account-prompt"
                href={urls.signUp}
                underline
              >
                {t('auth:Need an account? Create one now')}
              </AppLink>
            </div>
          </>
        )}
      </div>

      {/* Bottom section */}
      {redemptionData && (
        <div className={css.featuredWrapper}>
          <div className={css.featuredBottom}>
            <Image
              alt={redemptionData.pack.title}
              layout="fixed"
              height={340}
              width={340}
              src={`${redemptionData.pack.image}?fit=cover&height=340&width=340&quality=75`}
            />
            <p className={css.featuredBottomText}>
              {redemptionData.pack.title}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
