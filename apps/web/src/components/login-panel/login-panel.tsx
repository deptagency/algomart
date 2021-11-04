import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'

import css from './login-panel.module.css'

import Button from '@/components/button'
import { PackAndRedeemCode } from '@/contexts/redemption-context'

const googleIcon = '/images/logos/google.svg'

interface LoginPanelProps {
  handleLoginEmail(): void
  handleLoginGoogle(): Promise<void>
  handleRedeemEdition(): void
  isAuthenticated: boolean
  redemptionData: PackAndRedeemCode | null
}

export default function LoginPanel({
  handleLoginEmail,
  handleLoginGoogle,
  handleRedeemEdition,
  isAuthenticated,
  redemptionData,
}: LoginPanelProps) {
  const { t } = useTranslation()
  return (
    <section className={css.root}>
      <div className={css.buttonContainer}>
        {/* Claim button, present when redeeming */}
        {isAuthenticated && redemptionData && (
          <Button className={css.button} onClick={handleRedeemEdition}>
            {t('common:actions.Claim My Edition')}
          </Button>
        )}

        {/* Login buttons */}
        {!isAuthenticated && (
          <>
            <Button className={css.button} onClick={handleLoginEmail}>
              {t('auth:Sign in with Email')}
            </Button>
            <Button
              className={css.button}
              onClick={handleLoginGoogle}
              variant="secondary"
            >
              <Image
                width={36}
                height={36}
                alt={t('auth:Google logo')}
                src={googleIcon}
              />
              <p className={css.buttonImageText}>
                {t('auth:Sign in with Google')}
              </p>
            </Button>
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
