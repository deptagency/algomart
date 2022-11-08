import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'

import css from './signup-template.module.css'

import AppLink from '@/components/app-link/app-link'
import Button from '@/components/button'
import { H1 } from '@/components/heading'
import LinkButton from '@/components/link-button'
import { urls } from '@/utils/urls'

const googleIcon = '/images/logos/google.svg'

export default function SignupTemplate({
  handleLoginGoogle,
}: {
  handleLoginGoogle: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="mb-24">
      <H1 center mt={12} uppercase>
        {t('common:actions.Sign Up')}
      </H1>
      <div className={css.buttonContainer}>
        <LinkButton
          data-e2e="sign-up-with-email"
          className={css.button}
          href={urls.signUpEmail}
          size="large"
          variant="secondary"
        >
          {t('auth:Sign Up with Email')}
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
          <p className={css.buttonImageText}>{t('auth:Sign Up with Google')}</p>
        </Button>
        <div className={css.loginPrompt}>
          <AppLink href={urls.login} underline>
            {t('auth:Already have an account? Sign in')}
          </AppLink>
        </div>
      </div>
    </div>
  )
}
