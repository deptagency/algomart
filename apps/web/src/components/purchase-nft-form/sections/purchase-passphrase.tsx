import useTranslation from 'next-translate/useTranslation'
import { useCallback } from 'react'

import css from './purchase-passphrase.module.css'

import Heading from '@/components/heading'
import PassphraseInput from '@/components/passphrase-input/passphrase-input'

export interface PurchasePassphraseProps {
  error?: string
  handleSubmitPassphrase(passphrase: string): Promise<void>
}

export default function PurchasePassphrase({
  error,
  handleSubmitPassphrase,
}: PurchasePassphraseProps) {
  const { t } = useTranslation()

  const handleChange = useCallback(
    (passphrase: string) => {
      if (passphrase.length === 6) {
        handleSubmitPassphrase(passphrase)
      }
    },
    [handleSubmitPassphrase]
  )

  return (
    <div className={css.root}>
      <Heading level={2}>{t('forms:fields.passphrase.label')}</Heading>
      <div className={css.passphraseContainer}>
        <PassphraseInput error={error} handleChange={handleChange} />
        <p className={css.passphraseInstruction}>
          {t('release:passphraseApprove')}
        </p>
        {error && <p className={css.passphraseError}>{error}</p>}
      </div>
    </div>
  )
}
