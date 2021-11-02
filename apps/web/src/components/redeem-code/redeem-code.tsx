import useTranslation from 'next-translate/useTranslation'

import css from './redeem-code.module.css'

import AppLink from '@/components/app-link/app-link'
import PassphraseInput from '@/components/passphrase-input/passphrase-input'
import { urls } from '@/utils/urls'

interface RedeemCodeProps {
  error?: string
  handleChange(value: string): void
  redeemCode: string
}

export default function RedeemCode({
  error,
  handleChange,
  redeemCode,
}: RedeemCodeProps) {
  const { t } = useTranslation()

  return (
    <div className={css.root}>
      <h1 className={css.heading}>
        {t('common:actions.Enter your code to get started')}
      </h1>
      <div className={css.inputWrapper}>
        <PassphraseInput
          error={error}
          fields={12}
          handleChange={handleChange}
          value={redeemCode}
        />
      </div>
      <AppLink className={css.noCodeLink} href={urls.login}>
        {t('common:statuses.I don’t have a code')}
      </AppLink>
    </div>
  )
}
